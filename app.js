/* global grist */
'use strict';
const TABLES={operation:'Operations',compte:'Comptes',contrat:'Contrats',rh:'Contrats_RH',affectation:'Affectations_RH'};
const numeric=new Set(['Montant_brut','Budget_total','Budget_RH','Budget_fonctionnement','Budget_missions','Budget_investissements','Budget_maintenance','Budget_frais_gestion','Budget_autres','Financement_total','Part_IRIS','Part_ICube','Cout_mensuel','Budget_salaire','Budget_affecte','Cout_mensuel_affecte']);
const refs=new Set(['Compte','Contrat','Contrat_RH']);
const dates=new Set(['Date_operation','Date_debut','Date_fin']);
const toast=(message,error=false)=>{const n=document.querySelector('#toast');n.textContent=message;n.className=`show${error?' error':''}`;setTimeout(()=>n.className='',3000);};
const epoch=v=>v?Math.floor(new Date(`${v}T00:00:00Z`).getTime()/1000):null;
function toRecords(table){
  const ids=table.id||[];return ids.map((id,i)=>Object.fromEntries(Object.entries(table).map(([k,v])=>[k,k==='id'?id:v[i]])));
}
function fill(selects,records,label){
  for(const el of selects){const current=el.value;el.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());for(const r of records){const o=document.createElement('option');o.value=r.id;o.textContent=label(r);el.append(o);}el.value=current;}
}
async function refreshLists(){
  const [a,c,r]=await Promise.all([grist.docApi.fetchTable('Comptes'),grist.docApi.fetchTable('Contrats'),grist.docApi.fetchTable('Contrats_RH')]);
  fill(document.querySelectorAll('[data-source="accounts"]'),toRecords(a),x=>`${x.Code} — ${x.Libelle}`);
  fill(document.querySelectorAll('[data-source="contracts"]'),toRecords(c),x=>`${x.Code} — ${x.Libelle}`);
  fill(document.querySelectorAll('[data-source="rh"]'),toRecords(r),x=>`${x.Code_RH} — ${x.Nom_complet||`${x.Nom} ${x.Prenom}`}`);
}
function values(form){
  const out={};for(const [k,v] of new FormData(form)){if(v==='')continue;if(dates.has(k))out[k]=epoch(v);else if(refs.has(k))out[k]=Number(v)||0;else if(k==='Quotite')out[k]=(Number(v)||0)/100;else if(numeric.has(k))out[k]=Number(v)||0;else out[k]=v;}return out;
}
async function submit(form){
  const button=form.querySelector('.submit');button.disabled=true;
  try{await grist.docApi.applyUserActions([['AddRecord',TABLES[form.id],null,values(form)]]);toast('Enregistrement ajouté avec succès.');form.reset();await refreshLists();}
  catch(e){console.error(e);toast(`Échec de l’enregistrement : ${e.message||e}`,true);}finally{button.disabled=false;}
}
document.querySelector('#tabs').addEventListener('click',e=>{if(!e.target.dataset.tab)return;document.querySelectorAll('nav button,.panel').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');document.querySelector(`#${e.target.dataset.tab}`).classList.add('active');});
document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();submit(f);}));
grist.ready({requiredAccess:'full'});
refreshLists().then(()=>{document.querySelector('#state').textContent='Connecté à Grist';}).catch(e=>{document.querySelector('#state').textContent='Connexion impossible';toast('Ouvrez cette page comme widget personnalisé dans Grist.',true);console.error(e);});

