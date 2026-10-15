/* Integration seam: future A19/A11/A27 controllers can use a real service here.
 * Current functions return synthetic envelopes, without fetch or provider keys. */
(function(root){
  'use strict';
  root.CoachDemoService={
    loadAnalysis:async scenario=>root.CoachDemoData.analysis(scenario),
    loadPlan:async(snapshot,version)=>root.CoachDemoData.plan(snapshot,version)
  };
}(window));
