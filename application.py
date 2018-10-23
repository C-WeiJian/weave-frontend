from flask import Flask, render_template


application = Flask(__name__)


@application.route('/')
def landing():
    return application.send_static_file('landing.html')

@application.route('/operatorview')
def index():
    return application.send_static_file('index.html')

if __name__ == '__main__': application.run(debug=True)
