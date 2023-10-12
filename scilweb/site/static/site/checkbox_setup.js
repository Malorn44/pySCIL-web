// FUNCTION TO ABSTRACT BUILDING OF INPUT BOXES
function buildInputForm(settings, service, id) {
	var weight_box = "";
	var modal_box = "<ul>";
	// loop through all settings
	for (const setting in settings) {
		var temp = "<li> <div style='height: 30px'> <span class='modalText'> ";
		// change the name of the setting displayed to user based on if setting is 'weight' or not
		if (setting == "weight") {
			temp += id.split('_')[1];
		} else {
			temp += setting;
		} 
		temp += " </span>"
		// set 'type', and 'name' attributes
		temp += " <input type='" + settings[setting]['type'] + "' name='" + service + "' class='modalInput";
		// set 'class' to bevhavior if it exists
		if ('behavior' in settings[setting]) {
			temp += " " + settings[setting]['behavior'];
		}
		// add a 'step' attribute if one exists, otherwise defaults to 1 (html default)
		if ('step' in settings[setting]) {
			temp += "' step='" + settings[setting]['step'];
		}
		// add a 'min' attribute if one exists
		if ('min' in settings[setting]) {
			temp += "' min='" + settings[setting]['min'];
		}
		// add a 'max' attribute if one exists
		if ('max' in settings[setting]) {
			temp += "' max='" + settings[setting]['max'];
		}
		// set 'value' attribute to default and id to cfg_service_subservice_setting (or just cfg_service_setting)
		temp += "' value='" + settings[setting]['default'] + "' id='cfg_" + id + setting + "' required></div></li>";
		// if 'weight' setting add tempt to 'weight_box' otherwise add to 'modal_box'
		if (setting == "weight") {
			weight_box += temp;
		} else {
			modal_box += temp;
		}
	}
	modal_box += "</ul>"
	// return as a list 'modal_box' and 'weight_box'
	return [modal_box, weight_box];
}


// SET CHECKBOX VALUES
$.getJSON( "site/services.json", function( data ) {
	var service_list = [];
	var subservice_list = [];

	// Parent
	$(".checkboxes").append("<ul type='parent'></ul>")
	
	// APPEND SERVICES
	for (const service in data['services']) {
		// push to service list
		service_list.push(service);

		// append service
		var id = 'chb_' + service;
		var option_box = "<li> <input type='checkbox' id='" + id + "' name='option' checked/> <b>";
		
		service.split(/(?=[A-Z])/).forEach(function(word) {
			option_box += ' ' + word;
		})
		option_box += "</b>"

		// APPEND MODAL
		if ('settings' in data['services'][service]) {
			option_box += " <a href='#' data-toggle='modal' data-target='#"+service+"'>[config]</a>";
		
			// split service string into its name
			service_name = "";
			service.split(/(?=[A-Z])/).forEach(function(word) {
				service_name += ' ' + word;
			})

			// set up weight box and modal box header
			var weight_box = "Weight Settings <ul>";
			var modal_box = "<div class='modal fade' id='" + service + "' tabindex='-1' aria-labelledby='" + service + "Label' aria-hidden='true'>";
			modal_box += "<div class='modal-dialog'> <div class='modal-content'>";
			modal_box += "<div class='modal-header'> <h5 class='modal-title' id='md_" + service + "Label'>" + service_name + "</h5></div>";
		
			// IF SERVICE REQUIRES OTHER SERVICES
			if ('requires' in data['services'][service]) {
				var requires = "";
				data['services'][service]['requires'].forEach(function(element) {
					element.split(/(?=[A-Z])/).forEach(function(word) {
						requires += ' ' + word;
					})
					requires += ","
				});
				modal_box += "<div class='modal-header'> Requires: " + requires.slice(0, -1) + "</div>"
			}

			// FILL OUT BODY
			modal_box += "<div class='modal-body'> <div class='modal-error'></div>";

			// global setting
			if (!$.isEmptyObject(data['services'][service]['settings'])) {
				modal_box += service_name + " Global Settings";
				var temp = buildInputForm(data['services'][service]['settings'], service, service + "_")
				modal_box += temp[0];
				weight_box += temp[1];
			}
			// subservice settings
			subservices = data['services'][service]['subservices']
			for (const subservice in subservices) {
				if ('settings' in subservices[subservice]) {
					// if the only config option weight?
					var onlyWeight = Object.keys(subservices[subservice]['settings']).length == 1 && subservices[subservice]['settings']['weight'];
					// if not, add a header for subservice. otherwise just includ "Weight Settings" header
					if (!onlyWeight) {
						subservice.split(/(?=[A-Z])/).forEach(function(word) {
							modal_box += ' ' + word;
						})
						shortname = subservices[subservice]['short'];
						if (shortname != subservice) {
							modal_box += ' (' + shortname + ')';
						}
					}
					var temp = buildInputForm(subservices[subservice]['settings'], service, service + "_" + subservice + "_");
					if (!onlyWeight) {
						modal_box += temp[0];
					}
					weight_box += temp[1];
				}
			}
			// if there are weight settings, add weight box to modal_box
			if (weight_box.length > 20) {
				modal_box += weight_box + "</ul>";
			}
			modal_box += "</div>";
			
			modal_box += "<div class='modal-footer'><button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>";
			modal_box += "</div></div></div>";		
			$(".modals").append(modal_box);
		}
		
		option_box += "<ul>";
		// append subservices
		for (const subservice in data['services'][service]['subservices']) {
			// push to subservice list
			subservice_list.push(data['services'][service]['subservices'][subservice]['short'])
			var id = 'chb_' + service + '_' + subservice;
			option_box += "<li> <input type='checkbox' id='" + id + "' name='subOption' checked/>";
			subservice.split(/(?=[A-Z])/).forEach(function(word) {
				option_box += ' ' + word;
			})
			shortname = data['services'][service]['subservices'][subservice]['short'];
			if (shortname != subservice) {
				option_box += ' (' + shortname + ')';
			}
			option_box += '</li>';
		}

		var col = data['services'][service]['loc'] || '0';
		var col = '.check' + col;

		$(col + " ul:first-child").append(option_box + '</ul></li>');
	}

	// SETTING NAMES FOR CHECKBOXES
	var i = k = 0
	$('[name="option"]').each(function() {
		$(this).val(service_list[i]);
		i += 1;
	});
	$('[name="subOption"]').each(function() {
		$(this).val(subservice_list[k]);
		k += 1;
    });
});
// SET CHECKBOX VALUES
