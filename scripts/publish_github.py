#!/usr/bin/env python3
"""Describe the current plan locally. The October publisher is retired."""
import argparse,json
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--execute',action='store_true')
    p.add_argument('--owner',default='Santana-R')
    p.add_argument('--repo',default='adaptive-rl-coach')
    p.add_argument('--use-existing',action='store_true',help=argparse.SUPPRESS)
    a=p.parse_args()
    if a.execute:
        p.error('El publicador de octubre fue retirado. Actualizar las issues existentes con el plan vigente; no recrear hitos ni fechas anteriores.')
    root=Path(__file__).resolve().parents[1]
    tasks=json.loads((root/'planning/tasks.json').read_text())
    links=json.loads((root/'planning/github-links.json').read_text())
    print(json.dumps({'mode':'read-only','repository':f'{a.owner}/{a.repo}','revision':links['revision'],'tasks':len(tasks),'next':[t['id'] for t in tasks if t['focus']],'milestones':links['milestones'],'external_changes':0},ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
