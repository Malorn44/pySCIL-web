import json
import jsonify
import requests
import os

import time

# import scil toolset
from scil import scil

from flask import Blueprint, render_template, Response, make_response, request, redirect, url_for, send_file, jsonify
# from scil.api.services import initialAnalysis

site = Blueprint('site', __name__, template_folder='templates', static_folder='static/site')


@site.route('/')
def index():
    return render_template('site/index.html')

def num(s):
    try:
        return int(s)
    except ValueError:
        return float(s)

### HANDLE FORM SUBMIT
@site.route('/form_submit', methods=['POST'])
def form_submit():

	if request.method == 'POST':
		obj = scil.SCIL(request.files['file']) 

		globalSettings = request.form.getlist("GlobalConfig")
		if (request.form.getlist('mode')[0] == 'stanford'):
			obj.preprocessStanford(*map(num,globalSettings))
		else:
			obj.preprocessNLTK(*map(num,globalSettings))
			
		# Get enabled services
		enabled_services = set(request.form.getlist('option'))
		enabled_subservices = set(request.form.getlist('subOption'))

        # Get available services
		filename = os.path.join(site.static_folder, 'services.json')
		with open(filename, 'r') as f:
			data = json.load(f)
			
			# Dictionary of call results
			callRes = {}
			callResSub = {}

			# Create JSON output
			res = {}

			#TODO: add config options back in (need to expand the original toolset for this first)

			# go through all services
			for service in data['services']:

				# GET CUSTOM SETTINGS
				settings = request.form.getlist(service)
				i = 0
				setting_dict = {service: {'settings': {}, 'subservices': {}}}
				if settings:
					# set global service configuration
					for setting in data['services'][service]['settings']:
						if 'array' in data['services'][service]['settings'][setting]:
							arrayName = data['services'][service]['settings'][setting]['array']
							if arrayName not in setting_dict[service]['settings']:
								setting_dict[service]['settings'][arrayName] = []
							setting_dict[service]['settings'][arrayName].append(num(settings[i]))
						else:	
							setting_dict[service]['settings'][setting] = num(settings[i])
						i += 1
					# set subservice configurations
					if 'subservices' in data['services'][service]:
						subservices_with_weights = []
						# copy global settings to subservices
						if setting_dict[service]['settings']:
							setting_dict[service]['subservices'] = {
								subservice: {'settings': {**{}, **setting_dict[service]['settings']}}
								for subservice in data['services'][service]['subservices']
							}
						for subservice in data['services'][service]['subservices']:
							if 'settings' in data['services'][service]['subservices'][subservice]:
								for setting in data['services'][service]['subservices'][subservice]['settings']:
									# if weight settings, wait to add since weights are always at the end
									if setting == "weight":
										subservices_with_weights.append(subservice)
									else:
										if subservice not in setting_dict[service]['subservices']:
											setting_dict[service]['subservices'][subservice] = {'settings': {}}
										if 'array' in data['services'][service]['subservices'][subservice]['settings'][setting]:
											arrayName = data['services'][service]['subservices'][subservice]['settings'][setting]['array']
											if arrayName not in setting_dict[service]['subservices'][subservice]['settings']:
												setting_dict[service]['subservices'][subservice]['settings'][arrayName] = []
												setting_dict[service]['settings'][arrayName] = []
											setting_dict[service]['subservices'][subservice]['settings'][arrayName].append(num(settings[i]))
											setting_dict[service]['settings'][
												data['services'][service]['subservices'][subservice]['short'].lower() + '_' + arrayName
											].append(num(settings[i]))	
										else:
											setting_dict[service]['subservices'][subservice]['settings'][setting] = num(settings[i])
											setting_dict[service]['settings'][
												data['services'][service]['subservices'][subservice]['short'].lower() + '_' + setting
											] = num(settings[i])
										i += 1
						# add weight settings
						for subservice in subservices_with_weights:
							if 'weights' not in setting_dict[service]['settings']:
								setting_dict[service]['settings']['weights'] = []
							setting_dict[service]['settings']['weights'].append(num(settings[i]))
							i += 1

				if service in enabled_services:
					# if service requires info from other services, add those as arguments
					args = {}
					if 'settings' in setting_dict[service]:
						args = {**args, **setting_dict[service]['settings']}
					if data['services'][service].get('requires'):
						args = {**args,
							**{required[0].lower() + required[1:] + 'Scores': 
								callRes[required] for required in data['services'][service]['requires']}
						}
					if args:
						callRes[service] = calls(obj,service,args)
					else:
						callRes[service] = calls(obj,service)
					
				# otherwise, call individual subservices that are enabled
				elif data['services'][service].get('subservices'):
					for subservice in data['services'][service]['subservices']:
						if data['services'][service]['subservices'][subservice]['short'] in enabled_subservices:
							args = {}
							print(setting_dict)
							if subservice in setting_dict[service]['subservices']:
								args = {**args, **setting_dict[service]['subservices'][subservice]['settings']}
							if not callResSub.get(service):
								callResSub[service] = {}
							callName = service+"_"+data['services'][service]['subservices'][subservice]['short'] 
							if args:
								callResSub[service][subservice] =  calls(obj,callName,args)
							else:
								callResSub[service][subservice] =  calls(obj,callName)

								
				# build out the return
				if callRes.get(service):
					new_r = {}
					for speaker in callRes[service]['speakers']:
						for subservice in callRes[service]['speakers'][speaker]:
							if not new_r.get(subservice):
								new_r[subservice] = {'speakers': {}}
							new_r[subservice]['speakers'][speaker] = callRes[service]['speakers'][speaker][subservice]
							if subservice in callRes[service]['error']:
								new_r[subservice]['error'] = callRes[service]['error'][subservice]
							else:
								new_r["average"+service]['error'] = callRes[service]['error'][service+"Functions"]
					res[service] = new_r
				elif callResSub.get(service):
					new_r = {}
					for subservice in data['services'][service]['subservices']:
						if callResSub[service].get(subservice):
							new_r[subservice] = {'speakers': {}}
							for element in callResSub[service][subservice]:
								new_r[subservice]['speakers'][element[0]] = element[1]
					res[service] = new_r

		# if "run" then just return json
		# if "runSave" then serve the file to the user
		# otherwise, return an error
		if "run" in request.form:
			return res
		elif "runSave" in request.form:
			res = jsonify(res)
			res.headers['Content-Disposition'] = 'attachment;filename=form_submit.json'
			return res
		return "error: invalid action"

def calls(obj, service, args=None):
	if args:
		return callHelper(obj, service)(**args)
	else:
		return callHelper(obj, service)()

def callHelper(obj, service):
	return {
		'Agreement': obj.AgreementFunctions,
		'Agreement_ATX': obj.AgreeAcceptIndex,
		'Agreement_TAX': obj.TopicalAgreementIndex,
		'ArgumentDiversity': obj.ArgumentDiversityFunctions,
		'ArgumentDiversity_VRI': obj.VocabularyRangeIndex,
		'ArgumentDiversity_VIM': obj.VocabularyIntroductionMeasure,
		'Disagreement': obj.DisagreementFunctions,
		'Disagreement_DRX': obj.DisagreeRejectIndex,
		'Disagreement_TDX': obj.TopicalDisagreementIndex,
		'EmotiveLanguageUse': obj.EmotiveLanguageUseFunctions,
		'EmotiveLanguageUse_EWI': obj.EmotiveWordIndex,
		'Involvement': obj.InvolvementFunctions,
		'Involvement_NPI': obj.NounPhraseIndex,
		'Involvement_TI': obj.TurnIndex,
		'Involvement_TCI': obj.TopicChainIndex,
		'Involvement_ASM': obj.AllSubsequentMentions,
		'Involvement_ATP': obj.AllotopicalityIndex,
		'NetworkCentrality': obj.NetworkCentralityFunctions,
		'NetworkCentrality_CLM': obj.CommunicationLinksMeasure,
		'NetworkCentrality_CRI': obj.CitationRateIndex,
		'NetworkCentrality_MTI': obj.MesoTopicIntroduction,
		'Sociability': obj.SociabilityFunctions,
		'Sociability_CNM': obj.ConversationalNormsMeasure,
		'Sociability_ADM': obj.AgreementDisagreementMeasure,
		'Sociability_NDI': obj.NetworkDensityIndex,
		'Sociability_CDI': obj.CiteDisparityIndex,
		'SocialPositioning': obj.SocialPositioningFunctions,
		'SocialPositioning_OCI': obj.OfferCommitIndex,
		'SocialPositioning_CRI': obj.ConfirmationRequestIndex,
		'TaskControl': obj.TaskControlFunctions,
		'TaskControl_DI': obj.DirectiveIndex,
		'TaskControl_PMI': obj.ProcessManagementIndex,
		'TaskControl_PMSI': obj.ProcessManagementSuccessIndex,
		'TaskFocus': obj.TaskFocusFunctions,
		'TaskFocus_MSM': obj.MesotopicStructureMeasure,
		'TaskFocus_MGM': obj.MesotopicGappingMeasure,
		'TensionFocus': obj.TensionFocusFunctions,
		'TensionFocus_DRT': obj.DisagreeRejectTargetIndex,
		'TensionFocus_TDT': obj.TopicalDisagreementTargetIndex,
		'TopicalPositioning': obj.TopicalPositioningFunctions,
		'TopicalPositioning_TPX': obj.TopicalPolarityIndex,
		'TopicalPositioning_PSX': obj.PolarityStrengthIndex,
		'TopicControl': obj.TopicControlFunctions,
		'TopicControl_LTI': obj.LocalTopicIntroduction,
		'TopicControl_SMT': obj.SubsequentMentionsLocalTopics,
		'TopicControl_CS': obj.CiteScore,
		'TopicControl_TL': obj.TurnLength,
		'Leadership': obj.Leadership,
		'Influencer': obj.Influencer,
		'PursuitOfPower': obj.PursuitOfPower,
		'GroupCohesion': obj.GroupCohesion
	}[service]