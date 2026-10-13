#!/usr/bin/env python3
"""Publish the approved planning package. Dry-run is the default; never embeds tokens."""
import argparse, json, subprocess, sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
TASKS = json.loads((ROOT/'planning/tasks.json').read_text(encoding='utf-8'))
STATE_PATH = ROOT/'planning/github-state.json'
PROJECT_TITLE = 'Adaptive RL Coach | Octubre–noviembre 2026'
MILESTONE_NAMES = ['Base y viabilidad', 'Primer bloque real', 'Diagnóstico y plan', 'Integración completa', 'Entrega preparada', 'Reserva de entrega']

def run(args, payload=None, check=True):
    p = subprocess.run(args, cwd=ROOT, text=True, input=None if payload is None else json.dumps(payload), capture_output=True)
    if check and p.returncode:
        # Do not print arbitrary stderr: it can contain private configuration.
        raise RuntimeError(f'Falló {args[0]} {args[1]} (código {p.returncode}). Revisar acceso/red y ejecutar de nuevo.')
    return p

def gh_json(*args):
    return json.loads(run(['gh',*map(str,args)]).stdout)

def api(path, method='GET', payload=None):
    args=['gh','api',path]
    if method!='GET': args+=['--method',method,'--input','-']
    return json.loads(run(args,payload).stdout)

def all_pages(path):
    pages=gh_json('api','--paginate','--slurp',path)
    return [item for page in pages for item in page]

def body(t, repo):
    dependency_links=', '.join(f'[{d}](https://github.com/{repo}/issues?q={quote(d)})' for d in t['dependencies']) or 'Ninguna'
    return f'''<!-- adaptive-rl-task:{t['id']} -->
## Resultado esperado
{t['title']}

Responsable: **{t['owner_full']}**
Revisor: **{t['reviewer_full']}**
Semana: **S{t['week']}** · Entrega interna: **{t['due']}** · Prioridad: **{t['priority']}**
RF: {', '.join(t['requirements'])}
Dependencias para cerrar: {dependency_links}

## Empieza por aquí
{t['first_action']}

## Base que ya tienes
{t['inputs']}

## Dónde trabajar
{t['work_area']}

## Pasos concretos
'''+ '\n'.join(str(i+1)+'. '+s for i,s in enumerate(t['steps'])) + f'''

## Entrega y conexión con el equipo
{t['deliverable']}

{t['handoff']}

## Ejemplo del resultado
{t['example']}

## Cómo comprobarlo
{t['verification']}

## Aceptación
'''+ '\n'.join('- [ ] '+c for c in t['acceptance']) + f'''

## Evidencia
{t['evidence']}

Reparto aceptado por Roberto el 13 de octubre de 2026. {'Tarea condicional de reserva; activar solo si es necesaria.' if t['conditional'] else 'Cerrar al cumplir aceptación, guardar/integrar, revisar y adjuntar evidencia. Los ejemplos sintéticos no acreditan integración real.'}
'''

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--owner',default='Santana-R')
    p.add_argument('--repo',default='adaptive-rl-coach')
    p.add_argument('--execute',action='store_true',help='Crear recursos y publicar; sin esta opción solo describe el plan.')
    p.add_argument('--use-existing',action='store_true',help='Permitir agregar la planificación a un repo existente. No sobrescribe archivos remotos.')
    args=p.parse_args()
    repo=f'{args.owner}/{args.repo}'
    if not args.execute:
        print(json.dumps({'mode':'dry-run','repository':repo,'visibility':'private','project':PROJECT_TITLE,'tasks':len(TASKS),'milestones':6,'labels':'semana, prioridad, responsable y contingencia','fields':['Status','Semana','Priority','Responsable','Revisor','Start date','Target date','Dependencias','RF'],'external_changes':0},ensure_ascii=False,indent=2));return
    if run(['gh','auth','status'],check=False).returncode:
        raise RuntimeError('GitHub no autentica. Ejecutar gh auth login -h github.com y verificar acceso al alcance project antes de publicar.')
    login=api('user')['login']
    if login.lower()!=args.owner.lower():
        raise RuntimeError('La cuenta autenticada no coincide con el propietario indicado. Revisar --owner.')
    state=json.loads(STATE_PATH.read_text()) if STATE_PATH.exists() else {'repo':repo,'items':{}}
    if state['repo']!=repo: raise RuntimeError('El archivo de reanudación corresponde a otro repositorio.')
    def save(): STATE_PATH.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')

    # Verify Projects permissions before creating anything.
    project_list=gh_json('project','list','--owner',args.owner,'--limit','100','--format','json')['projects']
    probe=run(['gh','api',f'repos/{repo}'],check=False)
    if probe.returncode:
        if '404' not in probe.stderr: raise RuntimeError('No fue posible verificar si el repositorio existe. No se creará a ciegas.')
        run(['gh','repo','create',repo,'--private','--description','Adaptive RL Coach: entrenamiento de Rocket League con métricas, reglas y planes versionados'])
        state['created_repo']=True;save()
    elif not state.get('created_repo') and not args.use_existing:
        raise RuntimeError('Ya existe un repositorio con ese nombre. Revisarlo y usar --use-existing si corresponde.')

    if state.get('created_repo') and not state.get('pushed'):
        if not (ROOT/'.git').exists(): run(['git','init','--initial-branch=main'])
        if run(['git','config','user.name'],check=False).returncode or run(['git','config','user.email'],check=False).returncode:
            raise RuntimeError('Falta identidad local de Git. Configurar user.name y user.email en este repositorio; no se inventará una identidad.')
        # Commit only this initial package and respect .gitignore.
        run(['git','add','.'])
        if run(['git','diff','--cached','--quiet'],check=False).returncode: run(['git','commit','-m','docs: organizar desarrollo de Adaptive RL Coach'])
        remote=run(['git','remote','get-url','origin'],check=False)
        if remote.returncode: run(['git','remote','add','origin',f'https://github.com/{repo}.git'])
        elif remote.stdout.strip() not in (f'https://github.com/{repo}.git',f'git@github.com:{repo}.git'):
            raise RuntimeError('origin apunta a otro repositorio; revisar antes de publicar.')
        run(['git','push','--set-upstream','origin','main']);state['pushed']=True;save()

    existing_labels={x['name'] for x in all_pages(f'repos/{repo}/labels?per_page=100')}
    labels={'prioridad:P0':'305bab','prioridad:P1':'659df2','contingencia':'6631d7'}
    labels.update({f'semana:S{w}':'c6dcff' for w in range(1,7)})
    labels.update({f'responsable:{n}':'dedaff' for n in ['Roberto','Tadeo','Luis','David']})
    for name,color in labels.items():
        if name not in existing_labels: api(f'repos/{repo}/labels','POST',{'name':name,'color':color,'description':'Clasificación de la planificación inicial'})
    ms={x['title']:x['number'] for x in all_pages(f'repos/{repo}/milestones?state=all&per_page=100')}
    dates=['2026-10-18','2026-10-25','2026-11-01','2026-11-06','2026-11-13','2026-11-20']
    for w,d in enumerate(dates,1):
        title=f'S{w} · {MILESTONE_NAMES[w-1]}'
        if title not in ms: ms[title]=api(f'repos/{repo}/milestones','POST',{'title':title,'due_on':d+'T23:59:00Z','description':'Fecha interna; reparto provisional. S6 es reserva, fecha académica pendiente.'})['number']

    issues=all_pages(f'repos/{repo}/issues?state=all&per_page=100')
    byid={t['id']:next((i for i in issues if f"<!-- adaptive-rl-task:{t['id']} -->" in (i.get('body') or '') and not i.get('pull_request')),None) for t in TASKS}
    for t in TASKS:
        if byid[t['id']] is None:
            issue_labels=[f"semana:S{t['week']}",f"prioridad:{t['priority']}",f"responsable:{t['owner']}"] + (['contingencia'] if t['conditional'] else [])
            byid[t['id']]=api(f'repos/{repo}/issues','POST',{'title':f"[{t['id']}] {t['title']}",'body':body(t,repo),'labels':issue_labels,'milestone':ms[f"S{t['week']} · {MILESTONE_NAMES[t['week']-1]}"]})
        print(f"{t['id']}: {byid[t['id']]['html_url']}")
    # Accounts are deliberately not assigned: real teammate usernames are still unknown.
    project=next((x for x in project_list if x['title']==PROJECT_TITLE),None)
    if project is None: project=gh_json('project','create','--owner',args.owner,'--title',PROJECT_TITLE,'--format','json')
    pn=str(project['number']);state['project']=project;save()
    run(['gh','project','link',pn,'--owner',args.owner,'--repo',repo])
    fields={f['name']:f for f in gh_json('project','field-list',pn,'--owner',args.owner,'--limit','100','--format','json')['fields']}
    specs=[('Semana','SINGLE_SELECT','S1,S2,S3,S4,S5,S6'),('Priority','SINGLE_SELECT','P0,P1'),('Responsable','SINGLE_SELECT','Roberto,Tadeo,Luis,David'),('Revisor','SINGLE_SELECT','Roberto,Tadeo,Luis,David'),('Start date','DATE',None),('Target date','DATE',None),('Dependencias','TEXT',None),('RF','TEXT',None)]
    for name,typ,options in specs:
        if name not in fields:
            cmd=['project','field-create',pn,'--owner',args.owner,'--name',name,'--data-type',typ,'--format','json']
            if options: cmd+=['--single-select-options',options]
            fields[name]=gh_json(*cmd)
    existing_items=gh_json('project','item-list',pn,'--owner',args.owner,'--limit','1000','--format','json')['items']
    existing_urls={(i.get('content') or {}).get('url') for i in existing_items}
    for t in TASKS:
        url=byid[t['id']]['html_url']
        # Re-running after planning was used must never reset an item's workflow.
        itemstate=state['items'].get(t['id'])
        if url in existing_urls and itemstate is None: continue
        if itemstate is None:
            item=gh_json('project','item-add',pn,'--owner',args.owner,'--url',url,'--format','json')
            itemstate={'id':item['id'],'fields_done':False};state['items'][t['id']]=itemstate;save()
        if itemstate['fields_done']: continue
        values={'Semana':('select',f"S{t['week']}"),'Priority':('select',t['priority']),'Responsable':('select',t['owner']),'Revisor':('select',t['reviewer']),'Start date':('date',t['start']),'Target date':('date',t['due']),'Dependencias':('text',', '.join(t['dependencies']) or 'Ninguna'),'RF':('text',', '.join(t['requirements']))}
        for name,(typ,val) in values.items():
            cmd=['gh','project','item-edit','--id',itemstate['id'],'--project-id',project['id'],'--field-id',fields[name]['id']]
            if typ=='select':
                option=next((o for o in fields[name].get('options',[]) if o['name']==val),None)
                if option is None: raise RuntimeError(f'El campo {name} no tiene la opción {val}; revisar el Project existente.')
                cmd+=['--single-select-option-id',option['id']]
            else: cmd+=['--'+typ,val]
            run(cmd)
        itemstate['fields_done']=True;save()
    print(f'Repositorio: https://github.com/{repo}')
    print(f'Project: {project.get("url", "consultar gh project view")}')
    print('Configurar en la interfaz las vistas Board por Status, Table y Roadmap por Start date/Target date. Vincular usuarios reales solo después de identificarlos.')

if __name__=='__main__':
    try: main()
    except (RuntimeError,KeyError,ValueError,StopIteration) as e:
        print(str(e),file=sys.stderr);sys.exit(1)
