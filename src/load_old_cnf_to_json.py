import os
# placeholder 
def load(file):
    unit_box =[]
    config =[]
    with open(f"cnf/{file}", "r") as r:
        for i,line in enumerate(r):
            if i in range(1,4):
                unit_box.append(float(line.strip()))
            if i >= 5:
                single_conf =[]
                single_conf.append(line)
                config.append(single_conf)
    r.close()
    
    positions =[]
    orientations =[]
    for x in config:
        x = x[0].split()
        x=[float(i) for i in x]
        position= []
        position.append(x[0])
        position.append(x[1])
        position.append(x[2])
        orientation =[]
        orientation.append(x[6])
        orientation.append(x[7])
        orientation.append(x[8])
        positions.append(position)
        orientations.append(orientation)

    return unit_box,positions,orientations

def gen_scrpt(file):
    unit_box,positions,orientations = load(file)
    script ='aa'
    script1= f"""{{"model":{{
                   "sets":[
                            {{
                                "name":"Set A",
                                "orientationType": "v",
                                "unitBox":{unit_box},
                                "positions":{positions},
                                "orientations":{orientations}

                            }}
                        ]
                    }}
    }}"""
    
    with open(f'Video_sample/{file}.json','w')as w:
        w.write(script1)

def main():
    os.chdir('cnf')
    file_name =[]
    for file in os.listdir():
        file_name.append(file)
    file_name.sort()
    file_name = file_name[1:]
    path =os.getcwd()
    parent = os.path.dirname(path)
    os.chdir(f'{parent}')
    
    for x in file_name:
        gen_scrpt(x)
if __name__=="__main__":
    main()