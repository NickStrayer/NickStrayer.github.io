from flask import Flask, render_template, request, send_file
import matplotlib
matplotlib.use('Agg')
import pandas as pd
import matplotlib.pyplot as plt
from grapher import compare_confrence, compare_event

import io

#python app.py

app = Flask(__name__)

# Sample dataset (can be replaced with a CSV)
data = pd.read_csv("2024_output.csv",index_col="events")

@app.route('/', methods=['GET', 'POST'])
def index():
    selected_categories = data.columns.unique()
    selected_events = data.index.unique()
    number = 10  # default
    event_num = 10

    if request.method == 'POST':
        form_type = request.form.get("form_id")

        if form_type == "events":
            selected_events = request.form.getlist("events")
            try:
                event_num = int(request.form.get("event_number"))
            except:
                event_num = 10
            selected_categories = request.form.getlist("hidden_category")
            try:
                number = int(request.form.get("hidden_number"))
            except:
                number = 10
        elif form_type == "conferences":
            selected_categories = request.form.getlist("category")
            try:
                number = int(request.form.get("number"))
            except:
                number = 10
            selected_events = request.form.getlist("hidden_event")
            try:
                event_num = int(request.form.get("hidden_event_number"))
            except:
                event_num = 10

    
    # Save selected categories for display
    return render_template('index.html',
                           categories=data.columns.unique(),
                           selected=selected_categories,
                           number = number,
                           event_num=event_num,
                           selected_events = selected_events,
                           events = data.index)

@app.route('/plot.png')
def plot_png():
    # Get selected categories from query string
    selected_categories = request.args.getlist('category')
    try:
            number = int(request.args.get("number"))
    except:
            number = 10

    
    fig = compare_confrence(selected_categories,number)

    # Output image to byte stream
    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype='image/png')

@app.route('/plot_events.png')
def plot_event():
    selected_events = request.args.getlist('events')
    
    try:
            event_num = int(request.args.get("event_number"))
    except:
            event_num = 10
    fig_events = compare_event(selected_events,event_num)

    buf = io.BytesIO()
    fig_events.savefig(buf, format='png')
    buf.seek(0)
    plt.close(fig_events)
    return send_file(buf, mimetype='image/png')




if __name__ == '__main__':
    app.run(debug=True)


