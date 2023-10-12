from flask import Flask
from flask_bootstrap import Bootstrap

# from .api.routes import api
from .site.routes import site

def create_app():
    app = Flask(__name__)

    Bootstrap(app)
    # app.register_blueprint(api)
    app.register_blueprint(site)

    app.config.update(dict(
        PREFERRED_URL_SCHEME = 'https'
    ))

    return app
