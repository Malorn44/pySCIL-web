// Modified from https://css-tricks.com/indeterminate-checkboxes/

$('div.checkbox-wrapper').on('change', 'input[type="checkbox"]', function(e) {

	var checked = $(this).prop("checked"),
		container = $(this).parent(),
		siblings = container.siblings();

	container.find('input[type="checkbox"]').prop({
		indeterminate: false,
		checked: checked
	});

	function checkSiblings(el) {
		var parent = el.parent().parent(),
			all = true;

			el.siblings().each(function() {
				let returnValue = all = ($(this).children('input[type="checkbox"]').prop("checked") === checked);
			return returnValue;
		});
	
		if (all && checked) {
			parent.children('input[type="checkbox"]').prop({
				indeterminate: false,
				checked: checked
			}).change();
	
		} else if (all && !checked) {
			parent.children('input[type="checkbox"]').prop({
				indeterminate: parent.find('input[type="checkbox"]:checked').length > 0,
				checked: checked
			}).change();
	
		} else {
			el.parents("li").children('input[type="checkbox"]').prop({
				indeterminate: true,
				checked: false
			}).change();
		}
	}
	checkSiblings(container); 
});


// MODAL BEHAVIORS
$('div.modals').on('keyup', 'input[class*="sync"]', function() {
	$('input[class="sync"], input[name="' + $(this).attr('name') + '"]').val($(this).val());
});	


// EXTRA BEHAVIORS
function disableCheckbox(checkbox) {
	$("#chb_"+checkbox).prop({
		indeterminate: false,
		checked: false,
		disabled: true,
		title: "requires other modules to function"
	});
}

function reactivateLeadership(topicControl=$("#chb_TopicControl").prop("checked"), 
	taskControl=$("#chb_TaskControl").prop("checked"), involvement=$("#chb_Involvement").prop("checked"), 
	disagreement=$("#chb_Disagreement").prop("checked")) {
		
	if (topicControl && taskControl && involvement && disagreement) {
		$("#chb_Leadership").prop("disabled", false).removeAttr("title");
	}
}

function reactivateInfluencer(topicControl=$("#chb_TopicControl").prop("checked"), 
	argumentDiversity=$("#chb_ArgumentDiversity").prop("checked"), networkCentrality=$("#chb_NetworkCentrality").prop("checked"), 
	disagreement=$("#chb_Disagreement").prop("checked")) {

	if (topicControl && argumentDiversity && networkCentrality && disagreement) {
		$("#chb_Influencer").prop("disabled", false).removeAttr("title");
	}
}

function reactivatePursuitOfPower(topicControl=$("#chb_TopicControl").prop("checked"), 
	disagreement=$("#chb_Disagreement").prop("checked"), tensionFocus=$("#chb_TensionFocus").prop("checked"), 
	networkCentrality=$("#chb_NetworkCentrality").prop("checked")) {

	if (topicControl && disagreement && tensionFocus && networkCentrality) {
		$("#chb_PursuitOfPower").prop("disabled", false).removeAttr("title");
	}
}

function reactivateGroupCohesion(topicControl=$("#chb_TopicControl").prop("checked"), 
	taskControl=$("#chb_TaskControl").prop("checked"), involvement=$("#chb_Involvement").prop("checked"), 
	agreement=$("#chb_Agreement").prop("checked"), disagreement=$("#chb_Disagreement").prop("checked"),
	sociability=$("#chb_Sociability").prop("checked"), taskFocus=$("#chb_TaskFocus").prop("checked")) {

	if (topicControl && taskControl && involvement && agreement && disagreement && sociability && taskFocus) {
		$("#chb_GroupCohesion").prop("disabled", false).removeAttr("title");
	}
}

$(document).ready(function () {
	$('div.checkbox-wrapper').on('change', '#chb_TopicControl', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Leadership");
			disableCheckbox("Influencer");
			disableCheckbox("PursuitOfPower");
			disableCheckbox("GroupCohesion");
		} else {
			reactivateLeadership();
			reactivateInfluencer();
			reactivatePursuitOfPower();
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_TaskControl', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Leadership");
			disableCheckbox("GroupCohesion");
		} else {
			reactivateLeadership();
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_Involvement', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Leadership");
			disableCheckbox("GroupCohesion");
		} else {
			reactivateLeadership();
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_Agreement', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("GroupCohesion");
		} else {
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_Disagreement', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Leadership");
			disableCheckbox("Influencer");
			disableCheckbox("PursuitOfPower");
			disableCheckbox("GroupCohesion");
		} else {
			reactivateLeadership();
			reactivateInfluencer();
			reactivatePursuitOfPower();
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_ArgumentDiversity', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Influencer");
		} else {
			reactivateInfluencer();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_NetworkCentrality', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("Influencer");
			disableCheckbox("PursuitOfPower");
		} else {
			reactivateInfluencer();
			reactivatePursuitOfPower();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_TensionFocus', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("PursuitOfPower");
		} else {
			reactivatePursuitOfPower();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_Sociability', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("GroupCohesion");
		} else {
			reactivateGroupCohesion();
		}
	});
	$('div.checkbox-wrapper').on('change', '#chb_TaskFocus', function() {
		if (!$(this).prop("checked")) {
			disableCheckbox("GroupCohesion");
		} else {
			reactivateGroupCohesion();
		}
	});
});
