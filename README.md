# pySCIL-Web
A web interface for the pySCIL toolset. For more information on pySCIL, view it's [github repository](https://github.rpi.edu/LACAI/pySCIL).

# How to Run
## Running with gunicorn
`gunicorn -b 127.0.0.1:8000 --log-level debug "scil:create_app()"`

If running on a server and you don't want the process to end once disconnected, run the following before running gunicorn

`screen -r` (if there is no screen running, type `screen` to create a new virtual terminal)

Then run the above gunicorn command.

After which you can type `ctrl+a` followed by `d` to detach the screen. The above `screen -r` command is for re-attaching.

After which, you can safely exit from the server.

## Running with flask
### If on Linux
```
export FLASK_APP=scilweb
export FLASK_ENV=development
flask run
```
### If on Windows
```
set FLASK_APP=scil
set FLASK_ENV=development
flask run
```

# Adding Services
1. In `services.json` define a `"service": { }` under services in the following format.
    ```
    "<ServiceName>": {
        "subservices": {
            "<SubserviceName>": {
                "short": "<ShortName>"
            }
        }
    }
    ```
    * see <b>Adding Configuration Settings</b> if you want to define settings for the service.
    * Note that at no point should there be any spaces in any of the names.
    * a `loc` can optionally be defined for the service in the form of `"loc": 1,` which will put the service in the second column of checkboxes in the graphical interface. The default is 0.
    * a `requires` can optionally be defined for a service in the form of `"requires": [<ServiceName>, <ServiceName>]`. The required services must be above the service that requires them in the json for it to work properly. The code will store the output of each service and feed that output into the service that requires it.
2. In `site/routes.py` under `def callHelper(obj, service)` define the function calls for the service and subservice in the following format
    ```
    '<ServiceName>': obj.<ServiceName>Functions,
    '<ServiceName>_<ShortName>': obj.<SubserviceName>
    ```
    For examples of this, please view the `callHelper` function in  `site/routes.py`

# Adding Configuration Settings
1. In the `services.json` define a `"settings": { }` under a service.
    * Ths doesn't need to have anything in it if you don't intend to add global config options but it is needed to display the button to open the settings panel.
2. Add a `"settings": { }` under each subservice that you want to define settings for.
3. Add config option(s) in the following format
    ```
    "settings": {
        "<SettingName>": {
            "default": <value>,
            "type": "<type>",
            "step": "<size>"
        }
    }
    ```
    * `default` and `type` are required. Type can be set to any [HTML input type](https://www.w3schools.com/html/html_form_input_types.asp) and default gets assigned to the `value` attribute for the input.
    * `step` is an optional setting and can be used for requiring a `number` input to have a certain step value. By default, the step value is 1.
    * Can optionally define a `min` or `max` value for a `number` in the format of
        ```
        "min": 0,
        "max": 1
        ```
        though other numbers  can of course be used besides 0 and 1. Just be sure that `max` is greater than `min`
    * Defining the `<SettingName>` to be `weight` will put the setting under a special `Weight Settings` header but will not change the functionality in the backend.
    * Values of settings will automatically be used to call a function. Functions will be called using the `<SettingName>` and `<value>` so make sure that the name chosen matches the name of the variable in the function you will be calling.
        
