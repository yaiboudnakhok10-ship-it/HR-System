import{u as le,a as te,b as ie,c as ae,d as oe,o as ne,e as o,f as s,g as y,w as m,v as f,h as re,F as E,r as h,i as c,n as v,t as _,j as H,k as U,l as B,m as b,s as N,S as g,p as pe,q as n}from"./index-DVXExXm2.js";const de={class:"_HEW_container"},_e={class:"_HEW_main_grid"},ue={class:"_HEW_card _HEW_animate_in",style:{"animation-delay":"0.1s"}},me={class:"_HEW_form_group"},ce={class:"_HEW_input_search_wrap"},ge={key:0,class:"_HEW_search_dropdown"},fe=["onClick"],ve={class:"emp-main"},be={class:"emp-code"},we={class:"emp-name"},ye={class:"emp-sub"},xe={class:"_HEW_form_group"},Ee=["value"],he={class:"_HEW_row"},We={class:"_HEW_form_group"},He={class:"_HEW_form_group"},ke={class:"_HEW_row"},$e={class:"_HEW_form_group"},Ce={class:"_HEW_form_group"},ze={class:"_HEW_row"},Se={class:"_HEW_form_group"},je={class:"_HEW_form_group"},Te={class:"_HEW_info_badge"},Ue={style:{display:"flex","flex-direction":"column",gap:"25px"}},Be={class:"_HEW_card _HEW_animate_in",style:{"animation-delay":"0.2s"}},Ve={class:"_HEW_row"},Fe={class:"_HEW_form_group"},De=["value"],Le={class:"_HEW_form_group"},Re={class:"_HEW_row"},Pe={class:"_HEW_form_group"},qe={class:"_HEW_form_group"},Ie={class:"_HEW_row_3",style:{"margin-bottom":"18px"}},Ne={class:"_HEW_form_group",style:{"margin-bottom":"0"}},Ae={key:0,class:"_HEW_image_placeholder"},Me=["src"],Oe={class:"_HEW_form_group",style:{"margin-bottom":"0"}},Ge={key:0,class:"_HEW_image_placeholder"},Ke=["src"],Ye={class:"_HEW_form_group",style:{"margin-bottom":"0"}},Je={key:0,class:"_HEW_image_placeholder"},Qe=["src"],Xe={class:"_HEW_row"},Ze={class:"_HEW_form_group"},es=["value"],ss={class:"_HEW_form_group"},ls=["value"],ts={class:"_HEW_form_group"},is={class:"_HEW_cart_section _HEW_animate_in",style:{"animation-delay":"0.3s"}},as={class:"_HEW_card_header"},os={id:"_HEW_PR_cartCount"},ns={key:0,class:"_HEW_empty_cart"},rs={key:1,class:"_HEW_table_container"},ps={class:"_HEW_cart_table"},ds={style:{"text-align":"center"}},_s={style:{"text-align":"center"}},us=["src"],ms={key:1,style:{color:"#94a3b8","font-size":"11px"}},cs={style:{"font-weight":"600"}},gs={key:0,style:{"font-size":"12px",color:"#059669","font-weight":"700"}},fs={style:{"text-align":"center"}},vs={style:{"text-align":"center"}},bs=["onClick"],ws="https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg",Es={__name:"WelfareRequest",setup(ys){const k=le(),V=te(),$=ie(),C=ae(),A=oe(),F=pe(),a=b({employee_code:"",title:"",first_name:"",last_name:"",position:"",department:"",project:"",company:"",work_age:"",phone:""}),i=b({welfare_type:"",welfare_item:"",remark:"",item_date:"",amount:0,signer1_name:"",signer2_name:"",signer1_position:"",signer2_position:"",image_file:null,image_preview:"",signature1_preview:"",signature2_preview:""}),u=b([]),W=b(!1),z=b([]),w=b(!1),d=b(!1),D=b(null);ne(async()=>{$.fetchEmployees(),C.fetchSupervisors(),V.fetchTypes(),history.state&&history.state.editData&&G(history.state.editData)}),typeof window<"u"&&window.addEventListener("click",l=>{l.target.closest("._HEW_input_search_wrap")||(w.value=!1)});async function M(l=""){W.value=!0;try{let e=N.from("employees").select("*");l&&(e=e.or(`employee_code.ilike.%${l}%,firstname.ilike.%${l}%,lastname.ilike.%${l}%`));const{data:t,error:p}=await e.limit(20);p||(z.value=t)}catch(e){console.error("Fetch external error:",e)}finally{W.value=!1}}function O(){w.value=!0,M(a.value.employee_code)}async function L(){const l=a.value.employee_code.trim();if(l){W.value=!0;try{const{data:e,error:t}=await N.from("employees").select("*").eq("employee_code",l).single();t||!e?(g.fire({icon:"error",title:"ไม่พบข้อมูล",text:"ไม่พบรหัสพนักงานนี้ในระบบ"}),P()):(R(e),g.mixin({toast:!0,position:"top-end",showConfirmButton:!1,timer:2e3}).fire({icon:"success",title:"พบข้อมูล: "+e.firstname+" "+e.lastname}))}catch(e){console.error("Search error:",e)}finally{W.value=!1,w.value=!1}}}function R(l){a.value.employee_code=l.employee_code,a.value.title=l.pn||"",a.value.first_name=l.firstname,a.value.last_name=l.lastname,a.value.phone=l.tel||"",a.value.position=l.department||"",a.value.department=l.position||"",a.value.project=l.project||"",a.value.company=l.company||"",a.value.work_age=l.experience||"",w.value=!1}function P(){a.value={employee_code:"",title:"",first_name:"",last_name:"",position:"",department:"",project:"",company:"",work_age:"",phone:""}}function G(l){d.value=!0,D.value=l.id,a.value={employee_code:l.employee_code||"",title:l.title||"",first_name:l.first_name||"",last_name:l.last_name||"",position:l.position||"",department:l.department||"",project:l.project||"",company:l.company||"",work_age:l.work_age||"",phone:l.phone||""},i.value={welfare_type:l.welfare_type||"",welfare_item:l.welfare_item||"",remark:l.remark||"",item_date:l.item_date||"",amount:l.amount||0,signer1_name:l.signer1_name||"",signer2_name:l.signer2_name||"",signer1_position:l.signer1_position||"",signer2_position:l.signer2_position||"",image_file:null,image_preview:l.image_url||"",signature1_preview:l.signature1_url||"",signature2_preview:l.signature2_url||""},u.value=[{...i.value,id:l.id,is_existing:!0}]}function S(l,e){const t=l.target.files[0];if(!t)return;const p=new FileReader;p.onload=r=>{e==="image"?(i.value.image_file=t,i.value.image_preview=r.target.result):e==="sig1"?i.value.signature1_preview=r.target.result:e==="sig2"&&(i.value.signature2_preview=r.target.result)},p.readAsDataURL(t)}function j(l){l==="image"?(i.value.image_file=null,i.value.image_preview=""):l==="sig1"?i.value.signature1_preview="":l==="sig2"&&(i.value.signature2_preview="")}function K(){const l=$.employees.find(e=>e.full_name===i.value.signer1_name);i.value.signature1_preview=l?l.signature_image:"",i.value.signer1_position=l?l.position:""}function Y(){const l=C.supervisors.find(e=>e.full_name===i.value.signer2_name);i.value.signature2_preview=l?l.signature_image:"",i.value.signer2_position=l?l.position:""}function J(){if(!i.value.welfare_type||!i.value.welfare_item){g.fire({icon:"warning",title:"ข้อมูลไม่ครบ",text:"กรุณากรอกหัวข้อและรายการสวัสดิการ"});return}u.value.push({...i.value,id:Date.now()}),q(),g.mixin({toast:!0,position:"top-end",showConfirmButton:!1,timer:2e3,timerProgressBar:!0}).fire({icon:"success",title:"เพิ่มรายการสำเร็จ"})}function q(){i.value={welfare_type:"",welfare_item:"",remark:"",item_date:"",amount:0,signer1_name:"",signer2_name:"",signer1_position:"",signer2_position:"",image_file:null,image_preview:"",signature1_preview:"",signature2_preview:""}}function Q(l){g.fire({title:"ยืนยันการลบ?",text:"ต้องการลบรายการนี้ออกจากตะกร้า?",icon:"warning",showCancelButton:!0,confirmButtonText:"ลบ",cancelButtonText:"ยกเลิก",confirmButtonColor:"#ef4444"}).then(e=>{e.isConfirmed&&u.value.splice(l,1)})}async function X(){if(!a.value.first_name){g.fire({icon:"warning",title:"ข้อมูลไม่ครบ",text:"กรุณาค้นหารหัสพนักงานก่อน"});return}if(u.value.length===0&&!d.value){g.fire({icon:"warning",title:"ไม่มีรายการ",text:"กรุณาเพิ่มรายการขอเบิกอย่างน้อย 1 รายการ"});return}d.value&&u.value.length===0?u.value.push({...i.value,id:D.value,is_existing:!0}):d.value&&(u.value[0]={...u.value[0],...i.value});const l=d.value?"ยืนยันการแก้ไข?":"ยืนยันบันทึกข้อมูล?",e=d.value?"ต้องการบันทึกการแก้ไขรายการใบเบิกนี้ใช่หรือไม่?":`ต้องการบันทึกรายการทั้งหมด ${u.value.length} รายการใช่หรือไม่?`;g.fire({title:l,text:e,icon:"question",showCancelButton:!0,confirmButtonText:"ยืนยัน",cancelButtonText:"ยกเลิก",confirmButtonColor:"#0ea5e9"}).then(async t=>{if(t.isConfirmed){g.fire({title:d.value?"กำลังอัปเดต...":"กำลังบันทึก...",allowOutsideClick:!1,didOpen:()=>g.showLoading()});try{const p=[];for(const r of u.value){let x=r.image_preview;r.image_file&&(x=await k.uploadFile(r.image_file));const I={...a.value,welfare_type:r.welfare_type,welfare_item:r.welfare_item,remark:r.remark,item_date:r.item_date,amount:r.amount,signer1_name:r.signer1_name,signer2_name:r.signer2_name,image_url:x,signature1_url:r.signature1_preview,signature2_url:r.signature2_preview,created_by:A.session?.userId};let T;d.value&&r.is_existing?T=await k.updateRequest(r.id,I):T=await k.addRequest(I),p.push({...T,image_url:x,signer1_position:r.signer1_position,signer2_position:r.signer2_position})}g.fire({icon:"success",title:d.value?"อัปเดตสำเร็จ":"บันทึกสำเร็จ!",text:d.value?"แก้ไขข้อมูลเรียบร้อยแล้ว ต้องการพิมพ์ใบเบิกใหม่หรือไม่?":"บันทึกข้อมูลเรียบร้อย ต้องการพิมพ์ใบเบิกหรือไม่?",showCancelButton:!0,confirmButtonText:"พิมพ์ทันที",cancelButtonText:d.value?"กลับหน้าตาราง":"ยังไม่พิมพ์"}).then(r=>{r.isConfirmed&&ee(p);const x=d.value;Z(),x&&F.push("/admin/welfare-request-show")})}catch(p){g.fire({icon:"error",title:"ผิดพลาด",text:p.message})}}})}function Z(){P(),q(),u.value=[],d.value=!1}function ee(l){const t=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ใบขอเบิกสวัสดิการ</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@100..900&family=Prompt:wght@100;300;400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { margin: 0; padding: 0; background: #f0f0f0; }
          .a4-sheet {
            width: 210mm; min-height: 297mm; background: white; 
            padding: 12mm 15mm 16mm 15mm; font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; 
            font-size: 9.5pt; line-height: 1.5; color: #1a1a1a; position: relative;
            page-break-after: always; margin: 0 auto;
          }
          .lao-text { font-family: 'Phetsarath', sans-serif !important; line-height: 1.8; }
          .doc-header { display: flex; align-items: center; margin-bottom: 10px; }
          .doc-logo { background: white; padding: 5px 8px; border-radius: 4px; flex-shrink: 0; width: 110px; display: flex; align-items: center; justify-content: center; }
          .doc-logo img { height: 48px; width: auto; object-fit: contain; display: block; }
          .doc-title-center { flex: 1; text-align: center; font-size: 14pt; font-weight: 800; color: #1a1a1a; }
          .doc-header-spacer { width: 110px; flex-shrink: 0; }
          
          .sec-box { border: 1.5px solid #444; margin-bottom: 8px; }
          .sec-title { background: #b8b8b8; text-align: center; font-weight: 700; font-size: 10pt; padding: 4px 10px; border-bottom: 1.5px solid #444; color: #1a1a1a; }
          .sec-body { padding: 6px 14px; }
          
          .info-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .info-left { padding-right: 12px; border-right: 1px solid #ccc; }
          .info-right { padding-left: 12px; }
          .info-row { display: grid; grid-template-columns: 105px 1fr; align-items: baseline; padding: 3.5px 0; gap: 2px; }
          .info-lbl { font-weight: 700; color: #111; font-size: 8.8pt; white-space: nowrap; }
          .info-val { font-size: 8.8pt; color: #1a1a1a; min-height: 15px; word-break: break-word; }
          
          .info-row-full { display: grid; grid-template-columns: 160px 1fr; align-items: baseline; padding: 3.5px 0; gap: 2px; }
          .info-lbl-lg { font-weight: 700; color: #111; font-size: 8.8pt; white-space: nowrap; }
          .info-val-full { font-size: 8.8pt; color: #1a1a1a; min-height: 15px; }

          .sig-emp-section { margin-top: 14px; display: flex; flex-direction: column; align-items: center; margin-left: auto; width: 50%; padding-right: 10mm; }
          .sig-emp-dots { font-size: 9.5pt; letter-spacing: 2px; color: #000; margin-top: 22px; text-align: center; }
          .sig-emp-name { font-size: 8.8pt; color: #222; text-align: center; margin-top: 3px; }
          .sig-emp-date { font-size: 9pt; margin-top: 6px; display: flex; align-items: center; gap: 6px; align-self: flex-start; }
          
          .sig-bottom-wrap { display: grid; grid-template-columns: 1fr 1fr; margin-top: 20px; padding-left: 10%; padding-right: 2%; gap: 0; }
          .sig-col { display: flex; flex-direction: column; align-items: flex-start; padding: 0 8px; }
          .sig-col-label { font-size: 9pt; font-weight: 600; margin-bottom: 0; }
          .sig-col-img-wrap { height: 90px; width: 220px; display: flex; align-items: center; justify-content: flex-start; margin-top: 6px; margin-left: 28px; overflow: hidden; }
          .sig-col-img { max-height: 88px; max-width: 218px; width: auto; height: auto; object-fit: contain; display: block; }
          .sig-col-dots { font-size: 9.5pt; letter-spacing: 1.5px; color: #444; margin-top: 60px; margin-left: 28px; }
          .sig-col-name { font-size: 8.5pt; color: #222; margin-top: 3px; margin-left: 28px; }
          .sig-col-date { font-size: 8.5pt; margin-top: 4px; display: flex; align-items: center; gap: 4px; margin-left: 28px; }
          .sig-col-role { font-size: 7.8pt; color: #444; margin-top: 3px; line-height: 1.45; margin-left: 28px; }
          
          .p2-cond-title { background: #b8b8b8; text-align: center; font-weight: 700; font-size: 10pt; padding: 4px 10px; border: 1.5px solid #444; border-bottom: none; color: #1a1a1a; }
          .p2-cond-box { border: 1.5px solid #444; padding: 8px 14px; margin-bottom: 10px; font-size: 8pt; line-height: 1.75; color: #1a1a1a; }
          .p2-photo-wrap { display: flex; justify-content: center; align-items: center; width: 100%; border: 1.5px solid #444; height: 750px; padding: 10px; margin-bottom: 10px; background: white; overflow: hidden; }
          .p2-photo-wrap img { width: 100%; height: 100%; max-height: 730px; object-fit: contain; display: block; image-rendering: -webkit-optimize-contrast; }
          .p2-sig-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 10px; }
          .p2-sig-label { font-size: 9.5pt; font-weight: 600; }
          .p2-sig-dots { font-size: 9.5pt; letter-spacing: 2px; color: #000; margin-top: 22px; }
          .p2-sig-name { font-size: 8.8pt; color: #222; margin-top: 3px; text-align: center; }
          .p2-sig-date { font-size: 9pt; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
          
          .doc-timestamp { position: absolute; bottom: 10mm; right: 15mm; font-size: 7.5pt; color: #666; }
        </style>
      </head>
      <body>
        ${l.map(r=>se(r)).join("")}
        <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 1200); }<\/script>
      </body>
    </html>
  `,p=window.open("","_blank");p.document.write(t),p.document.close()}function se(l){const e=new Date().toLocaleString("th-TH"),t=`${l.title||""}${l.first_name} ${l.last_name}`.trim(),p=l.amount?Number(l.amount).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00";return`
    <!-- PAGE 1 -->
    <div class="a4-sheet">
      <div class="doc-header">
        <div class="doc-logo"><img src="${ws}"></div>
        <div class="doc-title-center">แบบฟอร์มขอเบิกสวัสดิการ</div>
        <div class="doc-header-spacer"></div>
      </div>
      
      <div class="sec-box">
        <div class="sec-title">ข้อมูลส่วนพนักงาน</div>
        <div class="sec-body">
          <div class="info-2col">
            <div class="info-left">
              <div class="info-row"><span class="info-lbl">รหัสพนักงาน :</span><span class="info-val">${l.employee_code||""}</span></div>
              <div class="info-row"><span class="info-lbl">ชื่อ และ นามสกุล :</span><span class="info-val">${t}</span></div>
              <div class="info-row"><span class="info-lbl">ตำแหน่ง :</span><span class="info-val">${l.position||""}</span></div>
              <div class="info-row"><span class="info-lbl">แผนก :</span><span class="info-val">${l.department||""}</span></div>
            </div>
            <div class="info-right">
              <div class="info-row"><span class="info-lbl">โครงการ :</span><span class="info-val">${l.project||""}</span></div>
              <div class="info-row"><span class="info-lbl">บริษัท :</span><span class="info-val">${l.company||""}</span></div>
              <div class="info-row"><span class="info-lbl">อายุงาน :</span><span class="info-val">${l.work_age||""}</span></div>
              <div class="info-row"><span class="info-lbl">เบอร์โทร :</span><span class="info-val">${l.phone||""}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="sec-box">
        <div class="sec-title">ส่วนรายการขอเบิกสวัสดิการ</div>
        <div class="sec-body">
          <div class="info-row-full"><span class="info-lbl-lg">หัวข้อสวัสดิการ ผลตอบแทน :</span><span class="info-val-full">${l.welfare_type||""}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">รายการสวัสดิการ :</span><span class="info-val-full">${l.welfare_item||""}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">หมายเหตุ :</span><span class="info-val-full">${l.remark||""}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">วันที่ :</span><span class="info-val-full">${l.item_date||"–"}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">จำนวนเงิน :</span><span class="info-val-full">${p}</span></div>
        </div>
      </div>
      
      <div class="sig-emp-section">
        <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
        <div class="sig-emp-dots">.............................</div>
        <div class="sig-emp-name">( ${t} )</div>
        <div class="sig-emp-date">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>วันที่:</strong><span style="color:#555;letter-spacing:1px;">..... / ..... / .......</span></div>
      </div>
      
      <div class="sig-bottom-wrap">
        <div class="sig-col">
          <div class="sig-col-label">ลงชื่อ:</div>
          ${l.signature1_url?`<div class="sig-col-img-wrap"><img src="${l.signature1_url}" class="sig-col-img"></div>`:'<div class="sig-col-dots">.................................</div>'}
          <div class="sig-col-name">( ${l.signer1_name||"........................................"} )</div>
          <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
          <div class="sig-col-role">${l.signer1_position||"จนท.สวัสดิการและพนักงานสัมพันธ์"}</div>
        </div>
        <div class="sig-col">
          <div class="sig-col-label">ลงชื่อ:</div>
          ${l.signature2_url?`<div class="sig-col-img-wrap"><img src="${l.signature2_url}" class="sig-col-img"></div>`:'<div class="sig-col-dots">.................................</div>'}
          <div class="sig-col-name">( ${l.signer2_name||"........................................"} )</div>
          <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
          <div class="sig-col-role">${l.signer2_position||"ผู้จัดการส่วนปฎิบัติการทรัพยากรบุคคล"}</div>
        </div>
      </div>
      
      <div class="doc-timestamp">${e}</div>
    </div>

    <!-- PAGE 2 -->
    <div class="a4-sheet">
      <div class="p2-cond-title lao-text"><u>เงื่อนไข:</u></div>
      <div class="p2-cond-box lao-text">
        -
      </div>
      
      <div class="p2-photo-wrap">
        ${l.image_url?`<img src="${l.image_url}">`:'<div style="color:#ccc; font-size:14pt;">📷</div>'}
      </div>
      
      <div class="p2-sig-wrap">
        <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
        <div class="p2-sig-dots">.........................</div>
        <div class="p2-sig-name">( ${t} )</div>
        <div class="p2-sig-date"><strong>วันที่ :</strong><span style="color:#555;letter-spacing:1px;">....... / ....... / .......</span></div>
      </div>
      
      <div class="doc-timestamp">${e}</div>
    </div>
  `}return(l,e)=>(n(),o("div",de,[e[66]||(e[66]=s("div",{class:"_HEW_page_header _HEW_animate_in"},[s("h1",null,[s("i",{class:"fas fa-boxes"}),y(" แบบฟอร์มขอเบิกสวัสดิการ")]),s("p",null,"กรอกข้อมูลและเพิ่มรายการขอเบิกสวัสดิการ")],-1)),s("div",_e,[s("div",ue,[e[35]||(e[35]=s("div",{class:"_HEW_card_header"},[s("i",{class:"fas fa-clipboard-list"}),s("h3",null,"ข้อมูลหลัก")],-1)),s("div",me,[e[23]||(e[23]=s("label",{class:"_HEW_form_label"},"รหัสไทยดิว",-1)),s("div",ce,[m(s("input",{"onUpdate:modelValue":e[0]||(e[0]=t=>a.value.employee_code=t),type:"text",class:"_HEW_form_control",placeholder:"กรุณาป้อนรหัสไทยดิว แล้วกด Enter",onInput:O,onFocus:e[1]||(e[1]=t=>w.value=!0),onKeyup:re(L,["enter"])},null,544),[[f,a.value.employee_code]]),s("button",{type:"button",class:"_HEW_input_search_btn",onClick:L,title:"ค้นหา"},[...e[22]||(e[22]=[s("i",{class:"fas fa-search"},null,-1)])]),w.value&&z.value.length>0?(n(),o("div",ge,[(n(!0),o(E,null,h(z.value,t=>(n(),o("div",{key:t.id,class:"_HEW_dropdown_item",onClick:p=>R(t)},[s("div",ve,[s("span",be,_(t.employee_code),1),s("span",we,_(t.firstname)+" "+_(t.lastname),1)]),s("div",ye,_(t.department)+" | "+_(t.position),1)],8,fe))),128))])):c("",!0)]),e[24]||(e[24]=s("small",{style:{color:"#64748b","margin-top":"4px",display:"block"}},"กด Enter หรือกดปุ่มค้นหาเพื่อดึงข้อมูล",-1))]),s("div",xe,[e[25]||(e[25]=s("label",{class:"_HEW_form_label"},"ชื่อ-นามสกุล",-1)),s("input",{value:a.value.first_name?a.value.title+a.value.first_name+" "+a.value.last_name:"",type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.first_name}]),readonly:"",placeholder:"ดึงข้อมูลจากรหัสไทยดิว"},null,10,Ee)]),s("div",he,[s("div",We,[e[26]||(e[26]=s("label",{class:"_HEW_form_label"},"เบอร์โทร",-1)),m(s("input",{"onUpdate:modelValue":e[2]||(e[2]=t=>a.value.phone=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.phone}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.phone]])]),s("div",He,[e[27]||(e[27]=s("label",{class:"_HEW_form_label"},"ตำแหน่ง",-1)),m(s("input",{"onUpdate:modelValue":e[3]||(e[3]=t=>a.value.position=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.position}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.position]])])]),s("div",ke,[s("div",$e,[e[28]||(e[28]=s("label",{class:"_HEW_form_label"},"แผนก",-1)),m(s("input",{"onUpdate:modelValue":e[4]||(e[4]=t=>a.value.department=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.department}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.department]])]),s("div",Ce,[e[29]||(e[29]=s("label",{class:"_HEW_form_label"},"โครงการ",-1)),m(s("input",{"onUpdate:modelValue":e[5]||(e[5]=t=>a.value.project=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.project}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.project]])])]),s("div",ze,[s("div",Se,[e[30]||(e[30]=s("label",{class:"_HEW_form_label"},"บริษัท",-1)),m(s("input",{"onUpdate:modelValue":e[6]||(e[6]=t=>a.value.company=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.company}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.company]])]),s("div",je,[e[31]||(e[31]=s("label",{class:"_HEW_form_label"},"อายุงาน",-1)),m(s("input",{"onUpdate:modelValue":e[7]||(e[7]=t=>a.value.work_age=t),type:"text",class:v(["_HEW_form_control",{_HEW_auto_filled:a.value.work_age}]),readonly:"",placeholder:"ดึงข้อมูลอัตโนมัติ"},null,2),[[f,a.value.work_age]])])]),s("div",Te,[e[32]||(e[32]=s("i",{class:"fas fa-info-circle"},null,-1)),s("span",null,_(d.value?"โหมดแก้ไขข้อมูล":"กรุณาค้นหารหัสไทยดิวและเพิ่มรายการก่อนบันทึก"),1)]),s("button",{class:"_HEW_btn _HEW_btn_success _HEW_btn_block _HEW_btn_lg",onClick:X},[e[33]||(e[33]=s("i",{class:"fas fa-save"},null,-1)),y(" "+_(d.value?"บันทึกการแก้ไข":"บันทึกข้อมูล"),1)]),d.value?c("",!0):(n(),o("button",{key:0,class:"_HEW_btn _HEW_btn_primary _HEW_btn_block",style:{"margin-top":"10px"},onClick:e[8]||(e[8]=t=>H(F).push("/admin/welfare-request-show"))},[...e[34]||(e[34]=[s("i",{class:"fas fa-list-alt"},null,-1),y(" รายงานข้อมูลสวัสดิการ ",-1)])]))]),s("div",Ue,[s("div",Be,[e[59]||(e[59]=s("div",{class:"_HEW_card_header"},[s("i",{class:"fas fa-plus-circle"}),s("h3",null,"เพิ่มรายการเบิกสวัสดิการ")],-1)),s("div",Ve,[s("div",Fe,[e[37]||(e[37]=s("label",{class:"_HEW_form_label"},"หัวข้อสวัสดิการ",-1)),m(s("select",{"onUpdate:modelValue":e[9]||(e[9]=t=>i.value.welfare_type=t),class:"_HEW_form_control"},[e[36]||(e[36]=s("option",{value:""},"เลือกหัวข้อสวัสดิการ",-1)),(n(!0),o(E,null,h(H(V).types,t=>(n(),o("option",{key:t.id,value:t.title},_(t.title),9,De))),128))],512),[[U,i.value.welfare_type]])]),s("div",Le,[e[38]||(e[38]=s("label",{class:"_HEW_form_label"},"รายการสวัสดิการ",-1)),m(s("input",{"onUpdate:modelValue":e[10]||(e[10]=t=>i.value.welfare_item=t),type:"text",class:"_HEW_form_control",placeholder:"กรอกรายการขอเบิก"},null,512),[[f,i.value.welfare_item]])])]),s("div",Re,[s("div",Pe,[e[39]||(e[39]=s("label",{class:"_HEW_form_label"},"วันที่",-1)),m(s("input",{"onUpdate:modelValue":e[11]||(e[11]=t=>i.value.item_date=t),type:"date",class:"_HEW_form_control"},null,512),[[f,i.value.item_date]])]),s("div",qe,[e[40]||(e[40]=s("label",{class:"_HEW_form_label"},"จำนวนเงิน",-1)),m(s("input",{"onUpdate:modelValue":e[12]||(e[12]=t=>i.value.amount=t),type:"number",class:"_HEW_form_control",placeholder:"0.00"},null,512),[[f,i.value.amount]])])]),s("div",Ie,[s("div",Ne,[e[44]||(e[44]=s("label",{class:"_HEW_form_label"},"รูปภาพ",-1)),s("div",{class:v(["_HEW_image_upload_box",{"has-image":i.value.image_preview}])},[s("input",{type:"file",onChange:e[13]||(e[13]=t=>S(t,"image")),accept:"image/*"},null,32),i.value.image_preview?c("",!0):(n(),o("div",Ae,[...e[41]||(e[41]=[s("i",{class:"fas fa-cloud-upload-alt"},null,-1),s("span",null,"คลิกเพื่อเลือกรูปภาพ",-1)])])),i.value.image_preview?(n(),o("img",{key:1,src:i.value.image_preview,class:"_HEW_preview_img",style:{display:"block"}},null,8,Me)):c("",!0),e[43]||(e[43]=s("div",{class:"_HEW_image_label_overlay"},"📷 รูปภาพ",-1)),i.value.image_preview?(n(),o("button",{key:2,type:"button",class:"_HEW_image_remove_btn",style:{display:"flex"},onClick:e[14]||(e[14]=B(t=>j("image"),["stop"]))},[...e[42]||(e[42]=[s("i",{class:"fas fa-times"},null,-1)])])):c("",!0)],2)]),s("div",Oe,[e[48]||(e[48]=s("label",{class:"_HEW_form_label"},"รูปลายเซ็น 1",-1)),s("div",{class:v(["_HEW_image_upload_box",{"has-image":i.value.signature1_preview}])},[s("input",{type:"file",onChange:e[15]||(e[15]=t=>S(t,"sig1")),accept:"image/*"},null,32),i.value.signature1_preview?c("",!0):(n(),o("div",Ge,[...e[45]||(e[45]=[s("i",{class:"fas fa-pen-nib"},null,-1),s("span",null,"คลิกเพื่อเลือกรูปลายเซ็น",-1)])])),i.value.signature1_preview?(n(),o("img",{key:1,src:i.value.signature1_preview,class:"_HEW_preview_img",style:{display:"block"}},null,8,Ke)):c("",!0),e[47]||(e[47]=s("div",{class:"_HEW_image_label_overlay"},"✍️ ลายเซ็น 1",-1)),i.value.signature1_preview?(n(),o("button",{key:2,type:"button",class:"_HEW_image_remove_btn",style:{display:"flex"},onClick:e[16]||(e[16]=B(t=>j("sig1"),["stop"]))},[...e[46]||(e[46]=[s("i",{class:"fas fa-times"},null,-1)])])):c("",!0)],2)]),s("div",Ye,[e[52]||(e[52]=s("label",{class:"_HEW_form_label"},"รูปลายเซ็น 2",-1)),s("div",{class:v(["_HEW_image_upload_box",{"has-image":i.value.signature2_preview}])},[s("input",{type:"file",onChange:e[17]||(e[17]=t=>S(t,"sig2")),accept:"image/*"},null,32),i.value.signature2_preview?c("",!0):(n(),o("div",Je,[...e[49]||(e[49]=[s("i",{class:"fas fa-pen-nib"},null,-1),s("span",null,"คลิกเพื่อเลือกรูปลายเซ็น",-1)])])),i.value.signature2_preview?(n(),o("img",{key:1,src:i.value.signature2_preview,class:"_HEW_preview_img",style:{display:"block"}},null,8,Qe)):c("",!0),e[51]||(e[51]=s("div",{class:"_HEW_image_label_overlay"},"✍️ ลายเซ็น 2",-1)),i.value.signature2_preview?(n(),o("button",{key:2,type:"button",class:"_HEW_image_remove_btn",style:{display:"flex"},onClick:e[18]||(e[18]=B(t=>j("sig2"),["stop"]))},[...e[50]||(e[50]=[s("i",{class:"fas fa-times"},null,-1)])])):c("",!0)],2)])]),s("div",Xe,[s("div",Ze,[e[54]||(e[54]=s("label",{class:"_HEW_form_label"},"ชื่อผู้เซ็น 1 (พนักงาน)",-1)),m(s("select",{"onUpdate:modelValue":e[19]||(e[19]=t=>i.value.signer1_name=t),class:"_HEW_form_control",onChange:K},[e[53]||(e[53]=s("option",{value:""},"เลือกพนักงานที่เซ็น...",-1)),(n(!0),o(E,null,h(H($).employees,t=>(n(),o("option",{key:t.id,value:t.full_name},_(t.full_name),9,es))),128))],544),[[U,i.value.signer1_name]])]),s("div",ss,[e[56]||(e[56]=s("label",{class:"_HEW_form_label"},"ชื่อผู้เซ็น 2 (หัวหน้า)",-1)),m(s("select",{"onUpdate:modelValue":e[20]||(e[20]=t=>i.value.signer2_name=t),class:"_HEW_form_control",onChange:Y},[e[55]||(e[55]=s("option",{value:""},"เลือกหัวหน้าที่เซ็น...",-1)),(n(!0),o(E,null,h(H(C).supervisors,t=>(n(),o("option",{key:t.id,value:t.full_name},_(t.full_name),9,ls))),128))],544),[[U,i.value.signer2_name]])])]),s("div",ts,[e[57]||(e[57]=s("label",{class:"_HEW_form_label"},"หมายเหตุ",-1)),m(s("textarea",{"onUpdate:modelValue":e[21]||(e[21]=t=>i.value.remark=t),class:"_HEW_form_control",placeholder:"หมายเหตุ"},null,512),[[f,i.value.remark]])]),s("button",{class:"_HEW_btn _HEW_btn_primary _HEW_btn_block _HEW_btn_lg",onClick:J},[...e[58]||(e[58]=[s("i",{class:"fas fa-plus"},null,-1),y(" เพิ่มรายการ ",-1)])])]),s("div",is,[s("div",as,[e[62]||(e[62]=s("i",{class:"fas fa-shopping-cart"},null,-1)),s("h3",null,[e[60]||(e[60]=y("รายการขอเบิกสวัสดิการ (",-1)),s("span",os,_(u.value.length),1),e[61]||(e[61]=y(" รายการ)",-1))])]),u.value.length===0?(n(),o("div",ns,[...e[63]||(e[63]=[s("i",{class:"fas fa-box-open"},null,-1),s("p",null,"ยังไม่มีรายการ",-1),s("small",null,"เพิ่มรายการด้านบนเพื่อเริ่มต้น",-1)])])):(n(),o("div",rs,[s("table",ps,[e[65]||(e[65]=s("thead",null,[s("tr",null,[s("th",{style:{width:"50px"}},"ลำดับ"),s("th",{style:{width:"100px"}},"รูปภาพ"),s("th",null,"หัวข้อการขอเบิก"),s("th",null,"รายการขอเบิก"),s("th",{style:{width:"120px"}},"วันที่"),s("th",{style:{width:"80px"}},"จัดการ")])],-1)),s("tbody",null,[(n(!0),o(E,null,h(u.value,(t,p)=>(n(),o("tr",{key:t.id},[s("td",ds,_(p+1),1),s("td",_s,[t.image_preview?(n(),o("img",{key:0,src:t.image_preview,class:"_HEW_cart_thumb"},null,8,us)):(n(),o("span",ms,"ไม่มีรูป"))]),s("td",null,_(t.welfare_type),1),s("td",null,[s("div",cs,_(t.welfare_item),1),t.amount?(n(),o("div",gs,_(Number(t.amount).toLocaleString())+" บาท ",1)):c("",!0)]),s("td",fs,_(t.item_date||"-"),1),s("td",vs,[s("button",{class:"_HEW_btn_icon_only",onClick:r=>Q(p),title:"ลบรายการ"},[...e[64]||(e[64]=[s("i",{class:"fas fa-trash-alt"},null,-1)])],8,bs)])]))),128))])])]))])])])]))}};export{Es as default};
