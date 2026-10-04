#!/usr/bin/env node

function isAppendixSlide(slide){
  const section=String(slide?.section||'').trim().toLowerCase();
  const step=String(slide?.storyStep||'').trim().toLowerCase();
  return Boolean(slide?.appendix||slide?.isAppendix||section==='appendix'||step==='appendix');
}

function explicitSections(deck){
  const raw=Array.isArray(deck?.majorSections)?deck.majorSections:Array.isArray(deck?.sections)?deck.sections:[];
  return raw.map(x=>typeof x==='string'?x:(x?.id||x?.title||x?.name||'')).filter(Boolean);
}

function inferredSections(slides){
  return [...new Set(slides.map(s=>String(s?.section||'').trim()).filter(x=>x&&x.toLowerCase()!=='appendix'))];
}

function evaluateDeckNavigation(plan,rules){
  const policy=rules?.navigationPolicy||{};
  const agenda=policy.agenda||{};
  const dividers=policy.sectionDividers||{};
  const all=Array.isArray(plan?.slides)?plan.slides:[];
  const main=all.filter(s=>!isAppendixSlide(s));
  const appendix=all.length-main.length;
  const explicit=explicitSections(plan?.deck||{});
  const sectionNames=explicit.length?explicit:inferredSections(main);
  const sectionCount=sectionNames.length;
  const linearStory=Boolean(plan?.deck?.linearStory||String(plan?.deck?.storyMode||'').toLowerCase()==='linear');
  const n=main.length;

  let decision='none',reason='short_linear_deck';
  const requiredMin=Number(agenda.requiredMinMainSlides??20);
  const recommendedMin=Number(agenda.recommendedMinMainSlides??10);
  const conditionalMin=Number(agenda.conditionalMinMainSlides??8);
  const conditionalMax=Number(agenda.conditionalMaxMainSlides??9);
  const sectionThreshold=Number(agenda.conditionalMajorSectionThreshold??3);
  const linearMayOmit=agenda.linearStoryMayOmitBelowRequired!==false;

  if(n>=requiredMin){
    decision='required';reason='long_deck';
  }else if(n>=recommendedMin){
    if(linearStory&&linearMayOmit){decision='optional';reason='linear_story_exception';}
    else{decision='recommended';reason='standard_long_deck';}
  }else if(n>=conditionalMin&&n<=conditionalMax&&sectionCount>=sectionThreshold){
    decision='recommended';reason='multi_section_mid_length_deck';
  }

  let dividerDecision='none';
  if(n>=Number(dividers.requiredMinMainSlides??30)) dividerDecision='required';
  else if(n>=Number(dividers.recommendedMinMainSlides??20)||sectionCount>=Number(dividers.recommendedMajorSections??4)) dividerDecision='recommended';
  else if(n>=recommendedMin&&sectionCount>=3) dividerDecision='optional';

  return {
    mainSlideCount:n,
    appendixSlideCount:appendix,
    majorSectionCount:sectionCount,
    majorSections:sectionNames,
    linearStory,
    appendixExcludedFromAgendaCount:policy.excludeAppendixFromMainCount!==false,
    agenda:{decision,reason},
    sectionDividers:{decision:dividerDecision}
  };
}

module.exports={evaluateDeckNavigation,isAppendixSlide};
