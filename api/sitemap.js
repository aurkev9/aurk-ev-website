export default async function handler(req,res){
  const base="https://aurk-ev-website.vercel.app";
  const project="https://tkfdsxmwrkucuhkjfouo.supabase.co";
  const key="sb_publishable_xcEAI3PBuys-dS-oMK-zWw_a5Eau7ou";
  try{
    const response=await fetch(project+"/rest/v1/site_studio_pages?select=slug,published_at&status=eq.published&order=published_at.desc",{headers:{apikey:key,Authorization:"Bearer "+key}});
    if(!response.ok)throw new Error("Published pages could not be loaded");
    const pages=await response.json();
    const urls=[{loc:base+"/",lastmod:new Date().toISOString()}];
    for(const page of pages||[]){if(page.slug&&page.slug!=="home")urls.push({loc:base+"/?page="+encodeURIComponent(page.slug),lastmod:page.published_at});}
    const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(item=>'  <url><loc>'+item.loc.replace(/&/g,"&amp;")+'</loc>'+(item.lastmod?'<lastmod>'+new Date(item.lastmod).toISOString().slice(0,10)+'</lastmod>':"")+'</url>').join("\n")+'\n</urlset>';
    res.setHeader("Content-Type","application/xml; charset=utf-8");
    res.setHeader("Cache-Control","public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  }catch(error){res.setHeader("Content-Type","application/xml; charset=utf-8");res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+base+'/</loc></url></urlset>');}
}
