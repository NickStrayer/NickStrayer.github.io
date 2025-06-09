import pandas as pd
import numpy as np
import ast
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')




def sort_helper(x,number):
    x = ast.literal_eval(x)
    x = x[:(number)]
    return np.mean(x)


    

def compare_confrence(con_list,number):
    df = pd.read_csv("2024_output.csv",index_col="events")

    x = df.index
    
    def sort_helper1(x):
        x = ast.literal_eval(x)
        x = x[:(number)]
        return np.mean(x)

    df = df.map(sort_helper1)

    figure = plt.figure()
    ax = figure.add_subplot(111)

    for col in con_list:
        ax.plot(x, df[col], "o", ms=10, lw=0.5, label=col)

    ax.set_xlabel('Event')
    ax.set_ylabel('World Athletics Score Top ' +str(number)+" Average" )
    plt.subplots_adjust(left=0.1,right=0.96,top=1,bottom=0.21)

    ax.legend(con_list)
    ax.tick_params(labelrotation=85)
    ax.grid(axis='x')


    return figure




compare_confrence(["Ivy","Big 12","SEC"],20)



def compare_event(events_list,number):
    df = pd.read_csv("2024_output.csv",index_col="events")

    
    fig,ax = plt.subplots()
    plot_list = []
    sorted = False
    for event in events_list:
        x = df.loc[event].apply(lambda x: sort_helper(x,number))
        print(x)
        if sorted == False:
            x = x.sort_values()
            sorted = True
        
        plot_list.append((x,event))
    
    figure = plt.Figure()
    ax = figure.add_subplot(111)

    for i in plot_list:
        ax.scatter(i[0].index,i[0].values,label=i[1])

    
    
    
    ax.legend()
    ax.tick_params(labelrotation=85)
    ax.grid(axis='x')
    figure.subplots_adjust(top=1.0, bottom=0.25, left=0.1, right=0.96)
    return figure
        



    