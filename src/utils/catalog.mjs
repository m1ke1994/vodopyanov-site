/** Missing or invalid dates always follow dated works in either direction. */
export function dateKey(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const key=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(key)&&new Date(key).toISOString().slice(0,10)===value?key:null;
}
export function sortCatalog(items,order='newest'){
 return items.map((item,index)=>({...item,sourceIndex:index})).sort((a,b)=>{
  const left=dateKey(a.publishedAt),right=dateKey(b.publishedAt);
  if(left===null&&right===null)return a.sourceIndex-b.sourceIndex;
  if(left===null)return 1;if(right===null)return -1;
  return (order==='oldest'?left-right:right-left)||a.sourceIndex-b.sourceIndex;
 });
}
export function formatDate(value){
 if(dateKey(value)===null)return 'Дата не указана';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
}
