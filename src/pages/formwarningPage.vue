<template>
  <div class="page-verbal">
    <div class="container">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div>
            <h1>
              <i class="fas fa-file-alt"></i>
              {{ isEditMode ? 'ฟอร์มแก้ไขใบเตือนพนักงาน' : 'ฟอร์มสร้างใบเดือนพนักงาน' }}
            </h1>
            <p>
              {{ isEditMode ? 'แก้ไขข้อมูลและบันทึกเพื่ออัปเดตใบเตือนพนักงาน' : 'กรอกข้อมูลและดำเนินการตามขั้นตอนเพื่อสร้างใบเดือนพนักงาน' }}
            </p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" @click="openVerbPage">
              <i class="fas fa-external-link-alt"></i> รายงานข้อมูลใบเตือน
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN GRID -->
      <div class="main-grid">

        <!-- LEFT: ข้อมูลพนักงาน -->
        <div class="card">
          <div class="card-header">
            <i class="fas fa-user-circle"></i>
            <h3>ข้อมูลพนักงาน</h3>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">ID</label>
            <div class="search-wrap">
              <input
                class="form-control"
                v-model="emp.code"
                placeholder="พิมพ์ชื่อ หรือรหัสพนักงาน..."
                @input="onEmpInput"
                @keypress.enter="selectFirstSuggestion"
                @blur="closeSuggestDelay('emp')"
                autocomplete="off"
              >
              <button class="search-btn" @click="selectFirstSuggestion" title="ค้นหา">
                <i :class="empStore.loading ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
              </button>
            </div>
            <div v-if="suggestions.length > 0" class="suggest-dropdown">
              <div
                v-for="item in suggestions"
                :key="item.id"
                class="suggest-item"
                @mousedown.prevent="selectEmployee(item)"
              >
                <span class="suggest-code">{{ item.employee_code }}</span>
                <span class="suggest-name">{{ item.fullname }}</span>
                <span class="suggest-dept">{{ item.department }}</span>
              </div>
            </div>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label class="form-label">ชื่อ-นามสกุล</label>
              <input class="form-control" v-model="emp.name" placeholder="ดึงข้อมูลอัตโนมัติ" :class="{'auto-filled':emp.name}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label">ตำแหน่ง</label>
              <input class="form-control" v-model="emp.dept" placeholder="ดึงข้อมูลอัตโนมัติ" :class="{'auto-filled':emp.dept}" readonly>
            </div>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label class="form-label">วันที่เกิดเหตุ</label>
              <input class="form-control" v-model="emp.startDate" type="date" :class="{'auto-filled':emp.startDate}">
            </div>
            <div class="form-group">
              <label class="form-label">สถานที่เกิดเหตุ</label>
              <input class="form-control" v-model="emp.location" placeholder="เช่น แคมป์สิริสิน">
            </div>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">รหัสผู้รู้เห็นเหตุการณ์ (ID)</label>
            <div class="search-wrap">
              <input
                class="form-control"
                v-model="emp.witnessCode"
                placeholder="รหัสพยาน"
                @input="onWitnessInput"
                @blur="closeSuggestDelay('witness')"
                autocomplete="off"
              >
              <div v-if="witnessSuggestions.length > 0" class="suggest-dropdown">
                <div
                  v-for="item in witnessSuggestions"
                  :key="item.id"
                  class="suggest-item"
                  @mousedown.prevent="selectWitness(item)"
                >
                  <span class="suggest-code">{{ item.employee_code }}</span>
                  <span class="suggest-name">{{ item.fullname }}</span>
                  <span class="suggest-dept">{{ item.department }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">ผู้รู้เห็นเหตุการณ์</label>
            <input class="form-control" v-model="emp.witness" placeholder="ชื่อพยาน" :class="{'auto-filled':emp.witness}" readonly>
          </div>

          <div class="form-group">
            <label class="form-label">ความเสียหาย</label>
            <input type="text" class="form-control" v-model="emp.damageValue" placeholder="เช่น รถชน, เครื่องจักรเสียหาย, ของหาย">
          </div>

          <div class="info-badge">
            <i class="fas fa-info-circle"></i>
            <span>กรุณาค้นหารหัสพนักงานและกรอกข้อมูลก่อนดำเนินการต่อ</span>
          </div>
        </div>

        <!-- RIGHT: STEPS -->
        <div class="right-panel">

          <!-- STEP 1 -->
          <div class="step-card" :class="{active:activeStep===1}" v-show="activeStep===1">
            <div class="step-header" @click="toggleStep(1)">
              <div class="step-badge"><i class="fas fa-clipboard-list"></i></div>
              <div class="step-title">ส่วนที่ 1 ข้อมูลเอกสารและความเสียหาย</div>
              <i class="fas fa-chevron-down step-chevron"></i>
            </div>
            <div class="step-body">
              <div class="two-col">
                <div>
                  <div class="form-group">
                    <label class="form-label">หัวข้อเหตุการณ์ (ประเภทความเสียหาย)</label>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step1.damagePersonal" id="s1personal">
                      <label for="s1personal" class="cb-label">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step1.damageAsset" id="s1asset">
                      <label for="s1asset" class="cb-label">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</label>
                    </div>
                    <div class="cb-group" style="margin-top:8px;">
                      <input type="checkbox" v-model="step1.damageOther" id="s1other">
                      <label for="s1other" class="cb-label">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</label>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="form-group">
                    <label class="form-label">เรื่อง</label>
                    <input type="text" v-model="emp.damage" class="form-control" placeholder="ป้อนข้อมูลเรื่อง">
                  </div>
                  <div class="form-group">
                    <label class="form-label">รายละเอียด</label>
                    <textarea class="form-control" v-model="emp.damageDetail" placeholder="ป้อนรายละเอียดเหตุการณ์" rows="4"></textarea>
                  </div>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-success" @click="completeStep(1)">ถัดไป <i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
          </div>

          <!-- STEP 2 -->
          <div class="step-card" :class="{active:activeStep===2}" v-show="activeStep===2">
            <div class="step-header" @click="toggleStep(2)">
              <div class="step-badge"><i class="fas fa-money-bill-wave"></i></div>
              <div class="step-title">ส่วนที่ 2 ประวัติการถูกลงโทษ</div>
              <i class="fas fa-chevron-down step-chevron"></i>
            </div>
            <div class="step-body">
              <div class="two-col">
                <div>
                  <div class="form-group">
                    <label class="form-label">ข้อกฎหมาย</label>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step2.hasViolation" id="s2viol">
                      <label for="s2viol" class="cb-label">ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໜວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ້ 3 ວິໄນພະນັກງານ</label>
                    </div>
                  </div>

                  <!-- ✅ Dropdown เลือกประเภทกฎระเบียบ -->
                  <div class="form-group">
                    <label class="form-label" style="color:red;">
                      <i class="fas fa-scale-balanced" style="color:red;margin-right:5px;"></i>
                      ประเภทกฎระเบียบ
                    </label>
                    <select
                      class="form-control"
                      v-model="step2.regulationTypeId"
                      @change="onRegulationTypeChange"
                    >
                      <option :value="null">
                        {{ regStore.loading ? 'กำลังโหลด...' : '-- เลือกประเภทกฎระเบียบ --' }}
                      </option>
                      <option
                        v-for="rt in regStore.regulation_types"
                        :key="rt.id"
                        :value="rt.id"
                      >
                        {{ rt.regulation_type_name }}
                      </option>
                    </select>
                  </div>

                  <!-- ✅ แสดงรายการกฎระเบียบที่เลือก -->
                  <div class="form-group" v-if="step2.regulationList && step2.regulationList.length">
                    <label class="form-label" style="color:red;">
                      <i class="fas fa-list-ul" style="margin-right:5px;"></i>
                      รายการกฎระเบียบ
                    </label>
                    <div class="regulation-list-box">
                      <div
                        v-for="(item, idx) in step2.regulationList"
                        :key="idx"
                        class="regulation-list-item"
                      >
                        <span class="reg-num">{{ idx + 1 }}</span>
                        <span class="reg-text">{{ item.name }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="!step2.regulationTypeId" class="reg-empty-hint">
                    <i class="fas fa-circle-info"></i>
                    เลือกประเภทกฎระเบียบเพื่อแสดงรายการ
                  </div>
                </div>

                <div>
                  <div class="form-group">
                    <label class="form-label">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</label>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step2.historyNever" id="s2never" @change="onHistoryNeverChange">
                      <label for="s2never" class="cb-label">ບໍ່ເຄີຍ</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step2.historyHas" id="s2has" @change="onHistoryHasChange">
                      <label for="s2has" class="cb-label">ເຄີຍຖຶກໂທດທາງວິໄນ</label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">ลงชื่อ (HR)</label>
                    <select class="form-control" v-model="step2.hrId" @change="selectHR">
                      <option :value="null">{{ sigStore.loading ? 'กำลังโหลด...' : '-- เลือก HR --' }}</option>
                      <option v-for="sig in sigStore.signatures" :key="sig.id" :value="sig.id">
                        {{ sig.signature_name }}{{ sig.responsibility ? ' — ' + sig.responsibility : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">รูปภาพลายเซ็น HR</label>
                    <div v-if="step2.hrImg" style="margin-top:6px;padding:10px;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:8px;">
                      <img :src="step2.hrImg" style="max-height:70px;border:1px solid #ddd;border-radius:6px;display:block;">
                      <span v-if="step2.hrResponsibility" style="font-size:11px;color:#c2410c;margin-top:5px;display:block;font-weight:600;">
                        {{ step2.hrResponsibility }}
                      </span>
                    </div>
                    <div v-else style="font-size:12px;color:#94a3b8;margin-top:6px;padding:10px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;">
                      <i class="fas fa-image" style="margin-right:5px;"></i> เลือก HR เพื่อแสดงรูปลายเซ็น
                    </div>
                  </div>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-gray btn-sm" @click="activeStep=1"><i class="fas fa-arrow-left"></i> ย้อนกลับ</button>
                <button class="btn btn-success" @click="completeStep(2)">ถัดไป <i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
          </div>

          <!-- STEP 3 -->
          <div class="step-card" :class="{active:activeStep===3}" v-show="activeStep===3">
            <div class="step-header" @click="toggleStep(3)">
              <div class="step-badge"><i class="fas fa-gavel"></i></div>
              <div class="step-title">ส่วนที่ 3 การลงโทษ</div>
              <i class="fas fa-chevron-down step-chevron"></i>
            </div>
            <div class="step-body">
              <div class="two-col">
                <div>
                  <div class="form-group">
                    <label class="form-label">เห็นการลงโทษทางวินัย</label>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step3.punish1" id="s3p1" @change="onPunish1Change">
                      <label for="s3p1" class="cb-label">ຕັກເຕືອນດ້ວຍວາຈາ</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step3.punish2" id="s3p2" @change="onWrittenChange">
                      <label for="s3p2" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step3.punish3" id="s3p3" @change="onWrittenChange">
                      <label for="s3p3" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step3.punish4" id="s3p4" @change="onWrittenChange">
                      <label for="s3p4" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</label>
                    </div>
                    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                      <input type="checkbox" v-model="step3.punish5" id="s3p5" @change="onWrittenChange" style="margin-top:3px;width:16px;height:16px;accent-color:#f97316;flex-shrink:0;cursor:pointer;">
                      <div style="flex:1;">
                        <label for="s3p5" class="cb-label" style="cursor:pointer;">ອື່ນໆ (ເຊັນພະນັກງານ) ...... ເລີກຈ້າງ (HR/MD)</label>
                        <transition name="fade">
                          <div v-if="step3.punish5" style="margin-top:10px;">
                            <label class="form-label" style="font-size:12px;color:#c2410c;margin-bottom:5px;">ระบุรายละเอียด</label>
                            <input class="form-control punish5-input" v-model="step3.punish5Text" placeholder="เช่น ระงับสัญญา, พักงาน 3 วัน, ไล่ออก...">
                            <div v-if="step3.punish5Text" class="punish5-preview">
                              <span style="opacity:0.7;">จะแสดงในเอกสาร:</span><br>
                              <strong>ອື່ນໆ (ເຊັນພະນັກງານ) {{ step3.punish5Text }} ເລີກຈ້າງ (HR/MD)</strong>
                            </div>
                          </div>
                        </transition>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="form-group">
                    <label class="form-label">ພະຍານ</label>
                    <select class="form-control" v-model="step3.witness1Id" @change="selectDoc('witness1')">
                      <option :value="null">{{ docStore.loading ? 'กำลังโหลด...' : '-- เลือกลายชื่อ --' }}</option>
                      <option v-for="doc in docStore.documents" :key="doc.id" :value="doc.id">{{ doc.document_name }}</option>
                    </select>
                    <div v-if="step3.witness1Name" class="sig-preview-box">
                      <div class="sig-preview-line">ລົງຊື່ <span class="sig-preview-blank"></span> ວັນທີ ____/____/______</div>
                      <div class="sig-preview-label">({{ step3.witness1Name }}) {{ step3.witness1Detail }}</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">ຮັກສາການຜູ້ຈັດການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ</label>
                    <select class="form-control" v-model="step3.witness2Id" @change="selectDoc('witness2')">
                      <option :value="null">{{ docStore.loading ? 'กำลังโหลด...' : '-- เลือกลายชื่อ --' }}</option>
                      <option v-for="doc in docStore.documents" :key="doc.id" :value="doc.id">{{ doc.document_name }}</option>
                    </select>
                    <div v-if="step3.witness2Name" class="sig-preview-box">
                      <div class="sig-preview-line">ລົງຊື່ <span class="sig-preview-blank"></span> ວັນທີ ____/____/______</div>
                      <div class="sig-preview-label">({{ step3.witness2Name }}) {{ step3.witness2Detail }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-gray btn-sm" @click="activeStep=2"><i class="fas fa-arrow-left"></i> ย้อนกลับ</button>
                <button class="btn btn-success" @click="activeStep=5">ถัดไป <i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
          </div>

          <!-- STEP 5: Preview & Print -->
          <div class="step-card" :class="{active:activeStep===5}" v-show="activeStep===5">
            <div class="step-header" @click="toggleStep(5)">
              <div class="step-badge" style="background:#f59e0b;"><i class="fas fa-eye"></i></div>
              <div class="step-title">ข้อมูลของเอกสาร (Preview)</div>
              <i class="fas fa-chevron-down step-chevron"></i>
            </div>
            <div class="step-body">
              <div class="preview-info">
                <i class="fas fa-info-circle"></i>
                ตรวจสอบข้อมูลของคุณก่อนยืนยัน ก่อนพิมพ์เอกสาร
              </div>
              <div class="preview-box">
                <div v-if="step3.punishGroup">
                  <strong>ประเภทเอกสาร:</strong>
                  <span :style="step3.punishGroup==='verbal' ? 'color:#c2410c;font-weight:700;' : 'color:#1d4ed8;font-weight:700;'">
                    {{ step3.punishGroup === 'verbal' ? 'ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ' : 'ໜັງສືຕັກເຕືອນດ້ວຍວິໄນ' }}
                  </span>
                </div>
                <div v-if="emp.name"><strong>ผู้กระทำความผิด:</strong> {{ emp.name }}</div>
                <div v-if="emp.code"><strong>ID:</strong> {{ emp.code }}</div>
                <div v-if="emp.dept"><strong>ตำแหน่ง:</strong> {{ emp.dept }}</div>
                <div v-if="emp.startDate"><strong>วันที่เกิดเหตุ:</strong> {{ emp.startDate }}</div>
                <div v-if="emp.location"><strong>สถานที่เกิดเหตุ:</strong> {{ emp.location }}</div>
                <div v-if="emp.witness"><strong>ผู้รู้เห็นเหตุการณ์:</strong> {{ emp.witness }}</div>
                <div v-if="emp.damageValue"><strong>ความเสียหาย:</strong> {{ emp.damageValue }}</div>
                <div v-if="emp.damage"><strong>เรื่อง:</strong> {{ emp.damage }}</div>
                <div v-if="emp.damageDetail"><strong>รายละเอียด:</strong> {{ emp.damageDetail }}</div>
                <!-- ✅ แสดงรายการกฎระเบียบที่เลือก -->
                <div v-if="step2.regulationList && step2.regulationList.length">
                  <div v-for="(r,i) in step2.regulationList" :key="i"> {{ i+1 }}. {{ r.name }}</div>
                </div>
                <div v-if="step2.historyNever || step2.historyHas">
                  <strong>ປະຫວັດ:</strong>
                  {{ step2.historyNever ? 'ບໍ່ເຄີຍ' : 'ເຄີຍຖຶກໂທດທາງວິໄນ' }}
                </div>
                <div v-if="step2.hrName"><strong>HR:</strong> {{ step2.hrName }} <span v-if="step2.hrResponsibility">({{ step2.hrResponsibility }})</span></div>
                <div v-if="step3.witness1Name"><strong>ພະຍານ:</strong> {{ step3.witness1Name }} — {{ step3.witness1Detail }}</div>
                <div v-if="step3.witness2Name"><strong>ຮັກສາການ:</strong> {{ step3.witness2Name }} — {{ step3.witness2Detail }}</div>
                <div v-if="!emp.name && !emp.code" style="color:#94a3b8;text-align:center;padding-top:30px;">
                  <i class="fas fa-file-alt" style="font-size:36px;opacity:0.2;display:block;margin-bottom:10px;"></i>
                  ยังไม่มีข้อมูล
                </div>
              </div>
              <div v-if="saveStatus" :class="['save-status', saveStatus.type]">
                <i :class="saveStatus.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                {{ saveStatus.message }}
              </div>
              <div class="action-row">
                <button class="btn btn-gray btn-sm" @click="activeStep=3"><i class="fas fa-arrow-left"></i> ย้อนกลับ</button>
                <button class="btn btn-gray btn-sm" @click="resetAll" v-if="!isEditMode"><i class="fas fa-undo"></i> เริ่มใหม่</button>
                <button class="btn btn-success btn-lg" v-if="!isEditMode" @click="addItemToList" :disabled="isPrinting">
                  <i :class="isPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-plus'"></i>
                  {{ isPrinting ? 'กำลังเพิ่มรายการ...' : 'เพิ่มรายการ' }}
                </button>
                <button class="btn btn-success btn-lg" v-else @click="submitAndPrint(null)" :disabled="isPrinting">
                  <i :class="isPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'"></i>
                  {{ isPrinting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขและพิมพ์' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ✅ ตารางรายการที่เพิ่มแล้ว -->
      <div v-if="!isEditMode && itemsList.length > 0" class="items-table-card">
        <div class="card-header">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <i class="fas fa-list-ul"></i>
            <h3>รายการที่รอพิมพ์ ({{ itemsList.length }} รายการ)</h3>
          </div>
          <button class="btn btn-primary btn-sm" @click="printAllItems" :disabled="isPrinting">
            <i :class="isPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-print'"></i>
            บันทึกและพิมพ์ทั้งหมด
          </button>
        </div>
        <div class="table-responsive">
          <table class="items-table">
            <thead>
              <tr>
                <th width="60">ลำดับ</th>
                <th width="120">ID พนักงาน</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เรื่อง</th>
                <th width="200">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in itemsList" :key="item.id">
                <td align="center">{{ index + 1 }}</td>
                <td>{{ item.emp.code }}</td>
                <td>{{ item.emp.name }}</td>
                <td>{{ item.emp.damage }}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-success btn-sm" @click="submitAndPrint(item)" :disabled="item.isPrinting">
                      <i :class="item.isPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-print'"></i>
                      พิมพ์
                    </button>
                    <button class="btn btn-danger btn-sm" @click="removeItem(index)">
                      <i class="fas fa-trash"></i>
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useEmployeeStore }        from '@/stores/Useemployeestore'
import { useSignatureStore }       from '@/stores/Usesignaturestore'
import { useDocumentTypeStore }    from '@/stores/Usedocumenttypestore'
import { useVerbalWarningStore }   from '../stores/UseVerbalWarningStore'
import { useRegulationTypeStore }  from '../stores/regulation_type.store'  // ✅ import store ใหม่
import { useRouter, useRoute }     from 'vue-router'
import { useAuthStore }            from '@/stores/auth.store'
import { supabase }                from '@/services/supabase'

const auth               = useAuthStore()
const empStore           = useEmployeeStore()
const sigStore           = useSignatureStore()
const docStore           = useDocumentTypeStore()
const verbalWarningStore = useVerbalWarningStore()
const regStore           = useRegulationTypeStore()   // ✅ store กฎระเบียบ

const router = useRouter()
const route = useRoute()
const openVerbPage = () => router.push('/verbaWarningPage')

const editId = computed(() => {
  const val = route.query?.id
  return val ? String(val) : ''
})
const isEditMode = computed(() => !!editId.value)

onMounted(() => {
  sigStore.getSignatures()
  docStore.getDocuments()
  regStore.getRegulationTypes()   // ✅ โหลดข้อมูลกฎระเบียบ
  if (!document.querySelector('script[src*="sweetalert2"]')) {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11'
    document.head.appendChild(s)
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css'
    document.head.appendChild(l)
  }

  if (isEditMode.value) {
    loadCaseForEdit(editId.value)
  }
})

const suggestions        = ref([])
const witnessSuggestions = ref([])
let searchTimer  = null
let witnessTimer = null

const emp = ref({
  code: '', name: '', dept: '', damage: '',
  startDate: '', location: '',
  witness: '', witnessCode: '',
  damageDetail: '', damageValue: ''
})

const activeStep = ref(1)
const isPrinting = ref(false)
const saveStatus = ref(null)
const itemsList  = ref([]) // ✅ รายการที่เพิ่มไว้

const step1 = ref({ damagePersonal: false, damageAsset: false, damageOther: false })

const step2 = ref({
  hasViolation: false,
  historyNever: false,
  historyHas: false,
  hrId: null, hrName: '', hrResponsibility: '', hrImg: '',
  // ✅ เพิ่มฟิลด์กฎระเบียบ
  regulationTypeId:   null,
  regulationTypeName: '',
  regulationList:     [],
})

const step3 = ref({
  punishGroup: 'verbal',
  punish1: false,
  punish2: false, punish3: false, punish4: false,
  punish5: false, punish5Text: '',
  witness1Id: null, witness1Name: '', witness1Detail: '',
  witness2Id: null, witness2Name: '', witness2Detail: '',
})

// ✅ เมื่อเลือกประเภทกฎระเบียบ → ดึงรายการของมัน
const onRegulationTypeChange = () => {
  const found = regStore.regulation_types.find(r => r.id === step2.value.regulationTypeId)
  if (found) {
    step2.value.regulationTypeName = found.regulation_type_name || ''
    step2.value.regulationList     = found.regulation_list      || []
  } else {
    step2.value.regulationTypeName = ''
    step2.value.regulationList     = []
  }
}

const onPunish1Change = () => {
  if (step3.value.punish1) {
    step3.value.punish2 = false; step3.value.punish3 = false
    step3.value.punish4 = false; step3.value.punish5 = false
    step3.value.punish5Text = ''
  }
  step3.value.punishGroup = 'verbal'
}

const onWrittenChange = () => {
  const anyWritten = step3.value.punish2 || step3.value.punish3 || step3.value.punish4 || step3.value.punish5
  if (anyWritten) { step3.value.punish1 = false; step3.value.punishGroup = 'written' }
  else             { step3.value.punishGroup = 'verbal' }
}

const onHistoryNeverChange = () => { if (step2.value.historyNever) step2.value.historyHas   = false }
const onHistoryHasChange   = () => { if (step2.value.historyHas)   step2.value.historyNever = false }

const step4 = ref({ amountBaht: '', amountKip: '', payDate: '', installment: '', chairman: '', viceChairman: '', committee1: '', committee2: '', committee3: '', secretary: '' })
const step5 = ref({ address: '', idCard: '', totalDamage: '', deductAmount: '', hrApprover: '' })

const selectHR = () => {
  const found = sigStore.signatures.find(s => s.id === step2.value.hrId)
  if (found) {
    step2.value.hrName = found.signature_name; step2.value.hrImg = found.signature_image
    step2.value.hrResponsibility = found.responsibility || ''
  } else {
    step2.value.hrName = ''; step2.value.hrImg = ''; step2.value.hrResponsibility = ''
  }
}

const selectDoc = (field) => {
  const id    = field === 'witness1' ? step3.value.witness1Id : step3.value.witness2Id
  const found = docStore.documents.find(d => d.id === id)
  if (field === 'witness1') {
    step3.value.witness1Name   = found ? found.document_name || '' : ''
    step3.value.witness1Detail = found ? found.detail        || '' : ''
  }
  if (field === 'witness2') {
    step3.value.witness2Name   = found ? found.document_name || '' : ''
    step3.value.witness2Detail = found ? found.detail        || '' : ''
  }
}

const onEmpInput = () => {
  clearTimeout(searchTimer)
  if (!emp.value.code || emp.value.code.length < 1) {
    emp.value.name = ''; emp.value.dept = ''; suggestions.value = []; return
  }
  emp.value.name = ''; emp.value.dept = ''
  searchTimer = setTimeout(async () => {
    suggestions.value = await empStore.searchByCode(emp.value.code)
  }, 300)
}

const selectEmployee = (item) => {
  emp.value.code = item.employee_code; emp.value.name = item.fullname; emp.value.dept = item.department
  if (!emp.value.startDate) emp.value.startDate = new Date().toISOString().split('T')[0]
  suggestions.value = []
}

const selectFirstSuggestion = () => {
  if (suggestions.value.length > 0) selectEmployee(suggestions.value[0])
}

const onWitnessInput = () => {
  clearTimeout(witnessTimer)
  if (!emp.value.witnessCode || emp.value.witnessCode.length < 1) {
    emp.value.witness = ''; witnessSuggestions.value = []; return
  }
  emp.value.witness = ''
  witnessTimer = setTimeout(async () => {
    witnessSuggestions.value = await empStore.searchByCode(emp.value.witnessCode)
  }, 300)
}

const selectWitness = (item) => {
  emp.value.witnessCode = item.employee_code; emp.value.witness = item.fullname
  witnessSuggestions.value = []
}

const closeSuggestDelay = (type) => {
  setTimeout(() => {
    if (type === 'emp')     suggestions.value = []
    if (type === 'witness') witnessSuggestions.value = []
  }, 200)
}

watch(() => emp.value.code, (val) => {
  if (!val || val.trim() === '') { emp.value.name = ''; emp.value.dept = ''; emp.value.startDate = ''; suggestions.value = [] }
})
watch(() => emp.value.witnessCode, (val) => {
  if (!val || val.trim() === '') { emp.value.witness = ''; witnessSuggestions.value = [] }
})

const toggleStep   = (step) => { if (activeStep.value !== step) activeStep.value = step }
const completeStep = (step) => { activeStep.value = step + 1 }

const resetAll = () => {
  activeStep.value = 1; saveStatus.value = null
  emp.value = { code: '', name: '', dept: '', damage: '', startDate: '', location: '', witness: '', witnessCode: '', damageDetail: '', damageValue: '' }
  step1.value = { damagePersonal: false, damageAsset: false, damageOther: false }
  step2.value = {
    hasViolation: false, historyNever: false, historyHas: false,
    hrId: null, hrName: '', hrResponsibility: '', hrImg: '',
    regulationTypeId: null, regulationTypeName: '', regulationList: [],
  }
  step3.value = {
    punishGroup: 'verbal',
    punish1: false, punish2: false, punish3: false, punish4: false,
    punish5: false, punish5Text: '',
    witness1Id: null, witness1Name: '', witness1Detail: '',
    witness2Id: null, witness2Name: '', witness2Detail: '',
  }
  step4.value = { amountBaht: '', amountKip: '', payDate: '', installment: '', chairman: '', viceChairman: '', committee1: '', committee2: '', committee3: '', secretary: '' }
  step5.value = { address: '', idCard: '', totalDamage: '', deductAmount: '', hrApprover: '' }
  suggestions.value = []; witnessSuggestions.value = []
}

const safeParseJson = (val) => {
  try { return JSON.parse(val) } catch { return null }
}

const matchSignatureId = (name, img) => {
  const found = sigStore.signatures.find(s =>
    (name && s.signature_name === name) || (img && s.signature_image === img)
  )
  return found?.id ?? null
}

const matchDocId = (docName, detail) => {
  const found = docStore.documents.find(d =>
    (docName && d.document_name === docName && (!detail || d.detail === detail))
  )
  return found?.id ?? null
}

const matchRegTypeIdByName = (name) => {
  const found = regStore.regulation_types.find(r => r.regulation_type_name === name)
  return found?.id ?? null
}

const loadCaseForEdit = async (id) => {
  if (!id) return
  isPrinting.value = true
  saveStatus.value = null
  try {
    const { data, error } = await supabase
      .from('verbal_warning_cases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    const detailObj = safeParseJson(data.detail) || {}
    emp.value = {
      code: data.employee_code || '',
      name: data.employee_name || '',
      dept: data.position || '',
      damage: data.subject || '',
      startDate: data.incident_date || '',
      location: data.incident_location || '',
      witness: data.witness_name || '',
      witnessCode: data.witness_code || '',
      damageDetail: detailObj.text || '',
      damageValue: data.damage_value || '',
    }

    step1.value = {
      damagePersonal: !!data.damage_personal,
      damageAsset: !!data.damage_asset,
      damageOther: !!data.damage_other,
    }

    step2.value = {
      ...step2.value,
      hasViolation: !!data.has_violation,
      historyNever: String(data.history_type || 'never') !== 'has',
      historyHas: String(data.history_type || 'never') === 'has',
      hrId: matchSignatureId(data.hr_name, data.hr_image),
      hrName: data.hr_name || '',
      hrResponsibility: data.hr_responsibility || '',
      hrImg: data.hr_image || '',
      regulationTypeId: matchRegTypeIdByName(detailObj.reg_type || ''),
      regulationTypeName: detailObj.reg_type || '',
      regulationList: Array.isArray(detailObj.reg_list) ? detailObj.reg_list : [],
    }

    step3.value = {
      punishGroup: data.punish_group || (data.punish_verbal ? 'verbal' : 'written'),
      punish1: !!data.punish_verbal,
      punish2: !!data.punish_written1,
      punish3: !!data.punish_written2,
      punish4: !!data.punish_written3,
      punish5: !!data.punish_other,
      punish5Text: data.punish_other_text || '',
      witness1Id: matchDocId(data.witness1_name, data.witness1_detail),
      witness1Name: data.witness1_name || '',
      witness1Detail: data.witness1_detail || '',
      witness2Id: matchDocId(data.witness2_name, data.witness2_detail),
      witness2Name: data.witness2_name || '',
      witness2Detail: data.witness2_detail || '',
    }

    activeStep.value = 1
  } catch (err) {
    window.Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#ef4444', confirmButtonText: 'ตกลง' })
  } finally {
    isPrinting.value = false
  }
}

watch(() => sigStore.signatures, () => {
  if (isEditMode.value && !step2.value.hrId && (step2.value.hrName || step2.value.hrImg)) {
    step2.value.hrId = matchSignatureId(step2.value.hrName, step2.value.hrImg)
  }
})

watch(() => docStore.documents, () => {
  if (!isEditMode.value) return
  if (!step3.value.witness1Id && step3.value.witness1Name) {
    step3.value.witness1Id = matchDocId(step3.value.witness1Name, step3.value.witness1Detail)
  }
  if (!step3.value.witness2Id && step3.value.witness2Name) {
    step3.value.witness2Id = matchDocId(step3.value.witness2Name, step3.value.witness2Detail)
  }
})

watch(() => regStore.regulation_types, () => {
  if (isEditMode.value && !step2.value.regulationTypeId && step2.value.regulationTypeName) {
    step2.value.regulationTypeId = matchRegTypeIdByName(step2.value.regulationTypeName)
  }
})

// ✅ เพิ่มรายการลงในตาราง
const addItemToList = () => {
  if (!emp.value.code || !emp.value.name) {
    window.Swal.fire({ title: 'แจ้งเตือน', text: 'กรุณากรอกข้อมูลพนักงานให้ครบถ้วนก่อนเพิ่มรายการครับ', icon: 'warning', confirmButtonColor: '#f97316' })
    return
  }

  // Clone ข้อมูลปัจจุบัน
  const newItem = {
    id: Date.now(),
    emp: JSON.parse(JSON.stringify(emp.value)),
    step1: JSON.parse(JSON.stringify(step1.value)),
    step2: JSON.parse(JSON.stringify(step2.value)),
    step3: JSON.parse(JSON.stringify(step3.value)),
    isPrinting: false
  }

  itemsList.value.push(newItem)
  
  window.Swal.fire({
    title: 'สำเร็จ',
    text: 'เพิ่มรายการเรียบร้อยแล้ว',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  })

  // ✅ ล้างเฉพาะข้อมูลพนักงาน เพื่อให้คีย์คนถัดไปได้ (ข้อมูลเหตุการณ์ยังอยู่เหมือนเดิม)
  emp.value.code = ''
  emp.value.name = ''
  emp.value.dept = ''
  suggestions.value = []
  
  // ย้อนกลับไป Step 1 เพื่อให้คีย์ ID พนักงานคนใหม่
  activeStep.value = 1
}

// ✅ ลบรายการออกจากตาราง
const removeItem = (index) => {
  itemsList.value.splice(index, 1)
}

const getPrintHTML = (itemData = null) => {
  // ถ้ามี itemData ให้ใช้ข้อมูลจาก itemData (ใช้ตอนพิมพ์จากตาราง)
  // ถ้าไม่มีให้ใช้จาก ref ปัจจุบัน (ใช้ตอนพิมพ์ทั่วไป)
  const targetEmp   = itemData ? itemData.emp   : emp.value
  const targetStep1 = itemData ? itemData.step1 : step1.value
  const targetStep2 = itemData ? itemData.step2 : step2.value
  const targetStep3 = itemData ? itemData.step3 : step3.value

  const empName        = targetEmp.name         || ''
  const empCode        = targetEmp.code         || ''
  const empDept        = targetEmp.dept         || ''
  const empDamage      = targetEmp.damage       || ''
  const empDetail      = targetEmp.damageDetail || ''
  const empDate        = targetEmp.startDate    || ''
  const empLocation    = targetEmp.location     || ''
  const empWitness     = targetEmp.witness      || ''
  const empWitnessCode = targetEmp.witnessCode  || ''
  const damageVal      = targetEmp.damageValue  || ''

  const hasPersonal = targetStep1.damagePersonal
  const hasAsset    = targetStep1.damageAsset
  const hasOther    = targetStep1.damageOther

  const hasViol     = targetStep2.hasViolation
  const neverPunish = targetStep2.historyNever
  const hasPunish   = targetStep2.historyHas
  const hrName      = targetStep2.hrName           || ''
  const hrResponsib = targetStep2.hrResponsibility || 'ພະຍານHR'
  const hrImgSrc    = targetStep2.hrImg

  // ✅ ดึงรายการกฎระเบียบที่เลือก
  const regulationList     = targetStep2.regulationList     || []

  const witness1Name   = targetStep3.witness1Name   || ''
  const witness1Detail = targetStep3.witness1Detail || ''
  const witness2Name   = targetStep3.witness2Name   || ''
  const witness2Detail = targetStep3.witness2Detail || 'ຮັກສາການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ'
  const punish5Text    = targetStep3.punish5Text    || ''

  const isVerbal = targetStep3.punishGroup === 'verbal'
  const docTitle = isVerbal ? 'ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ' : 'ໜັງສືຕັກເຕືອນດ້ວຍວິໄນ'

  const chk = (v) => v
    ? `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;">✓</span>`
    : `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`

  const line = (w) =>
    `<span style="display:inline-block;width:${w};border-bottom:1px solid #555;"></span>`

  const docSigBlock = (name, detail) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${line('150px')}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:150px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(${name || '____________________'})</div>
        <div>${detail}</div>
      </div>
    </div>`

  const punisherSigBlock = `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${line('150px')}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:150px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(____________________)</div>
        <div>ຜູ້ມີອຳນາດຕັກເຕືອນ</div>
      </div>
    </div>`

  const hrSigBox = `
    <span style="display:inline-flex;align-items:flex-end;justify-content:center;
      width:180px;min-height:68px;border-bottom:1px solid #555;overflow:hidden;flex-shrink:0;">
      ${hrImgSrc ? `<img src="${hrImgSrc}" style="max-width:178px;max-height:66px;width:auto;height:auto;object-fit:contain;object-position:center bottom;display:block;">` : ''}
    </span>`

  const hrSigBlockFull = `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${hrSigBox}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:180px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(${hrName || '____________________'})</div>
        <div>${hrResponsib}</div>
      </div>
    </div>`

  const punish5Label = targetStep3.punish5
    ? `ອື່ນໆ (ເຊັນພະນັກງານ)&nbsp;<span style="display:inline-block;min-width:80px;border-bottom:1.5px solid #222;padding:0 4px;font-weight:700;">${punish5Text}</span>&nbsp;ເລີກຈ້າງ (HR/MD)`
    : `ອື່ນໆ (ເຊັນພະນັກງານ)..................................ເລີກຈ້າງ (HR/MD)`

  const assetSubRows = `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;padding-left:14px;">
      <span style="min-width:12px;">1</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:13px;padding-left:4px;font-weight:700;">${hasAsset ? damageVal : ''}</span>
      <span style="padding-left:3px;">ກີບ</span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;padding-left:14px;">
      <span style="min-width:12px;">2</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:13px;"></span>
      <span style="padding-left:3px;">ກີບ</span>
    </div>`

  // ✅ สร้าง HTML รายการกฎระเบียบสำหรับพิมพ์ (แทน 3.9.5 / 3.9.3 เดิม)
  const regulationRowsHTML = regulationList.length
    ? regulationList.map((item, idx) =>
        `<div class="item-row" style="padding-left:4px;">
          <span><strong>${idx + 1}.</strong> ${item.name}</span>
        </div>`
      ).join('')
    : `<div class="item-row" style="padding-left:4px;color:#888;font-size:9px;">— ບໍ່ໄດ້ລະບຸລະບຽບ —</div>`

  return `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>${docTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',Arial,sans-serif;font-size:10.5px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;page-break-after:always;}
  .page:last-child{page-break-after:auto;}
  .page-inner{display:flex;flex-direction:column;padding:8mm 10mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:5px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;border-top:none;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:minmax(0,1.2fr) 1px minmax(0,0.8fr);border:1px solid #999;border-top:none;}
  .col-left{padding:6px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:6px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:5px;flex-wrap:nowrap;min-width:0;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;flex-shrink:0;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;flex-shrink:0;}
  .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;padding-top:1px;min-width:0;overflow:hidden;word-break:break-all;}
  .fv-md{width:90px;flex-shrink:0;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:1px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;line-height:1.5;font-size:10.5px;}
  .bottom-section{border:1px solid #999;border-top:none;padding:6px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:4px;}
  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;font-size:10.5px;line-height:1.6;}
  .s2-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10px;padding:8px 12px;}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;margin-top:18px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:5px 0;}
</style>
</head><body>
<div class="page"><div class="page-inner">

  <!-- HEADER -->
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">
      <img src="https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg" style="height:28px;width:auto;object-fit:contain;">
      <img src="https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png" style="height:28px;width:auto;object-fit:contain;">
    </div>
    <div class="doc-title">${docTitle}</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>

  <!-- SECTION 1 -->
  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div class="two-col-grid">
    <div class="col-left">
      <div class="inline-row">
        <span class="fl">ຜູ້ກະທຳຄວາມຜິດ</span><span class="fc">:</span>
        <span class="fv-md">${empName}</span>
        <span class="fl-sm">ID</span><span class="fc">:</span>
        <span class="fve">${empCode}</span>
      </div>
      <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
      <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDate}</span></div>
      <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
      <div class="inline-row">
        <span class="fl">ຜູ້ຮູ້ເຫດການ</span><span class="fc">:</span>
        <span class="fv-md">${empWitness}</span>
        <span class="fl-sm">ID</span><span class="fc">:</span>
        <span class="fve">${empWitnessCode}</span>
      </div>
      <div class="field-row"><span class="fl-w">ລາຍງານເສຍຫາຍ</span><span class="fc">:</span><span class="fve">${damageVal}</span></div>
      <div style="margin-top:4px;">
        <div class="cb-row">${chk(hasPersonal)}<span style="font-size:9.5px;">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</span></div>
        <div class="cb-row">${chk(hasAsset)}<span style="font-size:9.5px;">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</span></div>
        ${assetSubRows}
        <div class="cb-row" style="margin-top:2px;">${chk(hasOther)}<span style="font-size:9.5px;">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</span></div>
      </div>
    </div>
    <div class="col-divider"></div>
    <div class="col-right">
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
        <span style="font-weight:600;font-size:10px;white-space:nowrap;">ເລື່ອງ:</span>
        <span style="font-size:10px;flex:1;border-bottom:1px solid #ddd;padding-bottom:2px;padding-left:3px;">${empDamage}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span style="font-weight:600;font-size:10px;white-space:nowrap;">ລາຍລະອຽດ:</span>
        <span style="font-size:9.5px;flex:1;line-height:1.5;word-break:break-word;padding-left:3px;">${empDetail}</span>
      </div>
    </div>
  </div>

  <!-- Section 1 bottom sig -->
  <div class="bottom-section">
    <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin-top:4px;">
      <div>${docSigBlock('', 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
    </div>
  </div>

  <!-- SECTION 2 -->
  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈາລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ້ 3 ວິໄນພະນັກງານ</span></div>
      <!-- ✅ แสดงรายการ แทน 3.9.5 / 3.9.3 เดิม -->
      ${regulationRowsHTML}
      <div style="font-size:8.5px;color:#333;padding-left:4px;">ຈຶ່ງໄດ້ແຈ້ງໃຫ້ທ່ານຊາບ ແລະ ໃຫ້ທ່ານພິຈາລະນາດ້ວຍຕົນເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;">${chk(neverPunish)}<span style="font-size:9.5px;">ບໍ່ເຄີຍ</span></div>
        <div style="display:flex;align-items:center;gap:5px;">${chk(hasPunish)}<span style="font-size:9.5px;">ເຄີຍຖຶກໂທດທາງວິໄນ</span></div>
      </div>
      <hr class="hr-thin">
      <div style="font-size:9px;margin-top:4px;">
        <div style="display:flex;align-items:flex-end;gap:6px;line-height:1;">
          <span style="white-space:nowrap;line-height:1;padding-bottom:1px;min-width:70px;">ລົງຊື່ :</span>
          ${hrSigBox}
        </div>
        <div style="margin-top:2px;margin-left:calc(70px + 6px);width:180px;text-align:center;line-height:1.15;word-break:break-word;">
          (${hrName || '____________________'})
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 3 -->
  <div class="section-bar">ສ່ວນທີ 3 ການລົງໂທດ (ພິຈາລະນາຮ່ວມກັບຝ່າຍບຸກຄົນ)</div>
  <div class="s3-wrap">
    <div class="s3-left">
      <div class="item-row"><span style="font-weight:700;">ເຫັນສົມຄວນໃຫ້ລົງໂທດວິໄນ</span></div>
      <div class="item-row">${chk(step3.value.punish1)}<span>ຕັກເຕືອນດ້ວຍວາຈາ</span></div>
      <div class="item-row">${chk(step3.value.punish2)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</span></div>
      <div class="item-row">${chk(step3.value.punish3)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</span></div>
      <div class="item-row">${chk(step3.value.punish4)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</span></div>
      <div class="item-row">${chk(step3.value.punish5)}<span>${punish5Label}</span></div>
    </div>
    <div class="s3-right">
      <div style="font-size:9.5px;line-height:1.6;">
        <div>ອຳນາດການລົງໂທດວິໄນຕາມຂໍ້ບັງຄັບ</div>
        <div>ກຳມະການຜູ້ຈັດການ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ລະພະແນກເປັນຜູ້ໂທດ ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:2px;color:#c00;font-weight:700;font-size:9px;">****ກໍລະນີເລີກຈ້າງສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-block">
    <div style="font-size:9px;color:#444;font-style:italic;margin-bottom:4px;">
      ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລີກຈ້າງໂດຍບໍ່ຈ່າຍຄ່າຊົດເຊີຍ
    </div>
    <div class="sig-grid">
      <div>${punisherSigBlock}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານ (ຜູ້ຖືກລົງໂທດ)')}</div>
      <div>${docSigBlock(witness1Name, witness1Detail)}</div>
      <div>${hrSigBlockFull}</div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8px;color:#444;font-style:italic;margin-top:8px;text-align:center;">
      ( ຫາກທ່ານບໍ່ພໍໃຈການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົບບໍລິສັດ )
    </div>
  </div>

</div></div>
</body></html>`
}

const submitAndPrint = async (itemData = null) => {
  const targetEmp   = itemData ? itemData.emp   : emp.value
  const targetStep1 = itemData ? itemData.step1 : step1.value
  const targetStep2 = itemData ? itemData.step2 : step2.value
  const targetStep3 = itemData ? itemData.step3 : step3.value

  if (!targetEmp.code) {
    window.Swal.fire({ title: 'แจ้งเตือน', text: 'กรุณาเลือกพนักงานก่อนครับ', icon: 'warning', confirmButtonColor: '#f97316', confirmButtonText: 'ตกลง' })
    return
  }

  if (itemData) itemData.isPrinting = true
  else isPrinting.value = true
  
  saveStatus.value = null
  try {
    const toBase64 = async (url) => {
      const res = await fetch(url); const blob = await res.blob()
      return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob) })
    }
    const [logo1, logo2, hrImg] = await Promise.all([
      toBase64('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg').catch(() => ''),
      toBase64('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png').catch(() => ''),
      targetStep2.hrImg ? toBase64(targetStep2.hrImg).catch(() => '') : Promise.resolve('')
    ])
    let htmlContent = getPrintHTML(itemData)
    htmlContent = htmlContent
      .replace('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg', logo1)
      .replace('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png', logo2)
    if (targetStep2.hrImg && hrImg) htmlContent = htmlContent.replaceAll(targetStep2.hrImg, hrImg)

    const isEditingThisForm = isEditMode.value && !itemData
    const payload = {
      emp: targetEmp,
      step1: targetStep1,
      step2: {
        ...targetStep2,
        historyType: targetStep2.historyHas ? 'has' : 'never',
      },
      step3: targetStep3,
    }

    const result = isEditingThisForm
      ? await verbalWarningStore.updateCase(editId.value, {
          ...payload
        })
      : await verbalWarningStore.saveCase({
          ...payload,
          created_by: auth.session?.fullname || auth.session?.username || null,
          created_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        })

    if (!result.success) throw new Error(result.error)
    
    if (!itemData) {
      saveStatus.value = { type: 'success', message: isEditMode.value ? 'แก้ไขสำเร็จ!' : 'บันทึกสำเร็จ!' }
    }

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    doc.open(); doc.write(htmlContent); doc.close()
    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow.focus(); iframe.contentWindow.print()
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe)
            if (!itemData) {
              if (isEditMode.value) {
                router.push('/verbaWarningPage')
              } else {
                resetAll()
              }
            } else {
              // ✅ ถ้าพิมพ์จากตาราง ให้ลบรายการนั้นออกจากตารางหลังจากพิมพ์สำเร็จ
              const idx = itemsList.value.findIndex(it => it.id === itemData.id)
              if (idx !== -1) itemsList.value.splice(idx, 1)
            }
          }, 1000)
        }, 500)
      } catch (err) {
        console.error('Print Error:', err)
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
        throw err
      }
    }
  } catch (err) {
    console.error('Error:', err)
    if (!itemData) saveStatus.value = { type: 'error', message: 'เกิดข้อผิดพลาด: ' + err.message }
    window.Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#ef4444', confirmButtonText: 'ตกลง' })
  } finally {
    if (itemData) itemData.isPrinting = false
    else isPrinting.value = false
  }
}

// ✅ พิมพ์รายการทั้งหมดพร้อมกัน
const printAllItems = async () => {
  if (itemsList.value.length === 0) return
  
  const confirm = await window.Swal.fire({
    title: 'ยืนยันการพิมพ์ทั้งหมด',
    text: `คุณต้องการบันทึกและพิมพ์รายการทั้ง ${itemsList.value.length} รายการพร้อมกันใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ใช่, พิมพ์ทั้งหมด',
    cancelButtonText: 'ยกเลิก'
  })

  if (!confirm.isConfirmed) return

  isPrinting.value = true
  try {
    const toBase64 = async (url) => {
      const res = await fetch(url); const blob = await res.blob()
      return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob) })
    }

    // โหลดโลโก้หลักไว้ก่อนครั้งเดียว
    const [logo1, logo2] = await Promise.all([
      toBase64('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg').catch(() => ''),
      toBase64('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png').catch(() => '')
    ])

    let combinedHTML = ''
    
    // วนลูปบันทึกและรวบรวม HTML
    for (const item of itemsList.value) {
      item.isPrinting = true
      
      // บันทึกข้อมูลแยกแต่ละคน
      const result = await verbalWarningStore.saveCase({
        emp:   item.emp,
        step1: item.step1,
        step2: {
          ...item.step2,
          historyType: item.step2.historyHas ? 'has' : 'never',
        },
        step3:      item.step3,
        created_by: auth.session?.fullname || auth.session?.username || null,
        created_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      })

      if (!result.success) throw new Error(`ไม่สามารถบันทึกข้อมูลของ ${item.emp.name} ได้: ${result.error}`)

      // รวบรวม HTML
      const hrImg = item.step2.hrImg ? await toBase64(item.step2.hrImg).catch(() => '') : ''
      let itemHtml = getPrintHTML({ ...item, onlyBody: true })
      
      // แทนที่รูปภาพใน HTML
      itemHtml = itemHtml
        .replace('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg', logo1)
        .replace('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png', logo2)
      if (item.step2.hrImg && hrImg) itemHtml = itemHtml.replaceAll(item.step2.hrImg, hrImg)

      combinedHTML += itemHtml
    }

    // รวมเป็น HTML ฉบับสมบูรณ์
    const fullPrintHTML = `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>พิมพ์รายการทั้งหมด</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',Arial,sans-serif;font-size:10.5px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;page-break-after:always;}
  .page:last-child{page-break-after:auto;}
  .page-inner{display:flex;flex-direction:column;padding:8mm 10mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:5px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;border-top:none;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:minmax(0,1.2fr) 1px minmax(0,0.8fr);border:1px solid #999;border-top:none;}
  .col-left{padding:6px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:6px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:5px;flex-wrap:nowrap;min-width:0;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;flex-shrink:0;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;flex-shrink:0;}
  .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;padding-top:1px;min-width:0;overflow:hidden;word-break:break-all;}
  .fv-md{width:90px;flex-shrink:0;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:1px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;line-height:1.5;font-size:10.5px;}
  .bottom-section{border:1px solid #999;border-top:none;padding:6px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:4px;}
  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;font-size:10.5px;line-height:1.6;}
  .s2-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10px;padding:8px 12px;}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;margin-top:18px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:5px 0;}
</style>
</head><body>
${combinedHTML}
</body></html>`

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    doc.open(); doc.write(fullPrintHTML); doc.close()
    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow.focus(); iframe.contentWindow.print()
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe)
            itemsList.value = [] // ล้างรายการทั้งหมด
            resetAll() // ✅ รีเฟรชข้อมูลในฟอร์มทั้งหมดเพื่อเริ่มใหม่
            window.Swal.fire({ title: 'สำเร็จ', text: 'บันทึกและพิมพ์ข้อมูลพนักงานทั้งหมดเรียบร้อยแล้ว', icon: 'success' })
          }, 1000)
        }, 500)
      } catch (err) {
        console.error('Print Error:', err)
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
        throw err
      }
    }
  } catch (err) {
    console.error('Error:', err)
    window.Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#ef4444', confirmButtonText: 'ตกลง' })
  } finally {
    isPrinting.value = false
    itemsList.value.forEach(item => item.isPrinting = false)
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; }
.page-verbal {
  --primary:#f97316; --primary-dark:#c2410c; --primary-light:#fff7ed; --primary-border:#fed7aa;
  --success:#10b981; --success-light:#f0fdf4; --success-border:#86efac; --success-dark:#15803d;
  --danger:#ef4444; --dark:#1e293b; --gray:#64748b;
  --border:#d1d5db; --bg:#f8f9fa; --white:#fff;
  --radius:12px; --shadow:0 2px 8px rgba(0,0,0,0.08);
}
.page-verbal { background:var(--bg); min-height:100vh; padding:20px; color:var(--dark); font-size:14px; }
.page-verbal .container { max-width:1400px; margin:0 auto; }
.page-verbal .page-header { background:var(--white); padding:25px 30px; border-radius:var(--radius); margin-bottom:25px; box-shadow:var(--shadow); border-left:5px solid var(--primary); }
.page-verbal .page-header h1 { font-size:26px; font-weight:700; color:var(--dark); margin-bottom:4px; display:flex; align-items:center; gap:12px; }
.page-verbal .page-header h1 i { color:var(--primary); }
.page-verbal .page-header p { color:var(--gray); font-size:14px; }
.page-verbal .main-grid { display:grid; grid-template-columns:430px 1fr; gap:20px; align-items:start; }

/* ✅ CSS สำหรับตารางรายการ */
.items-table-card { background: var(--white); border-radius: var(--radius); margin-top: 25px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border); }
.items-table-card .card-header { padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
.items-table-card .card-header h3 { font-size: 18px; font-weight: 700; color: var(--dark); }
.items-table-card .card-header i { color: var(--primary); }
.table-responsive { width: 100%; overflow-x: auto; }
.items-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.items-table th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid var(--border); }
.items-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; color: var(--dark); vertical-align: middle; }
.items-table tr:hover { background: #f8fafc; }
.table-actions { display: flex; gap: 8px; }
.btn-danger { background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; transition: 0.2s; }
.btn-danger:hover { background: #dc2626; transform: translateY(-1px); }
.page-verbal .card { background:var(--white); border-radius:var(--radius); padding:25px; box-shadow:var(--shadow); border:1px solid var(--primary-border); }
.page-verbal .card-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid #fff3e0; }
.page-verbal .card-header h3 { font-size:17px; font-weight:600; color:var(--dark); }
.page-verbal .card-header i { font-size:20px; color:var(--primary); }
.page-verbal .form-group { margin-bottom:14px; }
.page-verbal .form-label { display:block; margin-bottom:6px; font-weight:600; color:var(--dark); font-size:13px; }
.page-verbal .form-control { width:100%; padding:10px 14px; border:1px solid var(--border); border-radius:8px; font-size:14px; transition:all 0.2s; background:var(--white); font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; outline:none; }
.page-verbal .form-control:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(249,115,22,0.14); }
.page-verbal .form-control.auto-filled { background:var(--primary-light)!important; border-left:3px solid var(--primary)!important; }
.page-verbal textarea.form-control { resize:vertical; min-height:80px; }
.page-verbal .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.page-verbal .search-wrap { position:relative; }
.page-verbal .search-wrap .form-control { padding-right:42px; }
.page-verbal .search-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:none; color:var(--primary); font-size:15px; cursor:pointer; padding:4px 6px; border-radius:6px; }
.page-verbal .search-btn:hover { background:var(--primary-light); }
.page-verbal .suggest-dropdown { position:absolute; top:calc(100% + 2px); left:0; right:0; background:#fff; border:1.5px solid var(--primary-border); border-radius:10px; box-shadow:0 8px 24px rgba(249,115,22,0.15); z-index:999; max-height:220px; overflow-y:auto; }
.page-verbal .suggest-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; font-size:13px; border-bottom:1px solid #fff3e0; transition:background 0.15s; }
.page-verbal .suggest-item:last-child { border-bottom:none; }
.page-verbal .suggest-item:hover { background:var(--primary-light); }
.page-verbal .suggest-code { font-weight:700; color:var(--primary-dark); min-width:90px; font-size:12px; background:#ffedd5; padding:2px 7px; border-radius:5px; }
.page-verbal .suggest-name { flex:1; font-weight:600; color:#1e293b; }
.page-verbal .suggest-dept { font-size:11px; color:#64748b; white-space:nowrap; }
.page-verbal .sig-preview-box { margin-top:8px; padding:10px 14px; background:var(--primary-light); border:1.5px solid var(--primary-border); border-radius:10px; font-size:12px; color:#1e293b; }
.page-verbal .sig-preview-line { display:flex; align-items:center; gap:6px; font-weight:600; color:#374151; margin-bottom:4px; }
.page-verbal .sig-preview-blank { display:inline-block; width:110px; border-bottom:1.5px solid #64748b; min-height:18px; }
.page-verbal .sig-preview-label { font-size:11px; color:var(--primary-dark); font-weight:600; padding-left:2px; }
.page-verbal .btn { padding:11px 22px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:8px; font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; transition:all 0.2s; text-decoration:none; }
.page-verbal .btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
.page-verbal .btn:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
.page-verbal .btn-primary { background:var(--primary); color:var(--white); }
.page-verbal .btn-success { background:var(--success); color:var(--white); }
.page-verbal .btn-gray    { background:#e2e8f0; color:#475569; }
.page-verbal .btn-sm      { padding:8px 16px; font-size:13px; }
.page-verbal .btn-lg      { padding:14px 28px; font-size:15px; }
.page-verbal .info-badge { display:inline-flex; align-items:center; gap:8px; padding:10px 15px; background:var(--primary-light); border-left:3px solid var(--primary); border-radius:8px; font-size:13px; color:var(--primary-dark); width:100%; }
.page-verbal .action-row { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid #fff3e0; }
.page-verbal .right-panel { display:flex; flex-direction:column; gap:16px; }
.page-verbal .step-card { background:var(--white); border-radius:var(--radius); box-shadow:var(--shadow); border:1px solid var(--primary-border); overflow:hidden; }
.page-verbal .step-header { padding:16px 22px; border-bottom:2px solid #fff3e0; display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none; }
.page-verbal .step-badge { width:32px; height:32px; border-radius:50%; background:var(--primary); color:var(--white); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; }
.page-verbal .step-title { font-size:15px; font-weight:700; color:var(--dark); flex:1; }
.page-verbal .step-chevron { color:#94a3b8; font-size:13px; transition:transform 0.25s; }
.page-verbal .step-card.active .step-chevron { transform:rotate(180deg); }
.page-verbal .step-body { padding:22px 25px; display:none; }
.page-verbal .step-card.active .step-body { display:block; }
.page-verbal .two-col { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
.page-verbal .cb-group { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
.page-verbal .cb-group input[type="checkbox"], .page-verbal .cb-group input[type="radio"] { margin-top:3px; width:16px; height:16px; accent-color:var(--primary); flex-shrink:0; cursor:pointer; }
.page-verbal .cb-label { font-size:13px; color:#374151; line-height:1.6; }
.page-verbal .punish5-input { border:1.5px solid var(--primary) !important; background:var(--primary-light) !important; }
.page-verbal .punish5-preview { margin-top:8px; padding:9px 13px; background:#f0fdf4; border:1px solid #86efac; border-left:3px solid #10b981; border-radius:8px; font-size:12px; color:#166534; line-height:1.7; }

/* ✅ สไตล์ regulation list */
.page-verbal .regulation-list-box { display:flex; flex-direction:column; gap:5px; padding:10px 12px; background:#fff7ed; border:1.5px solid #fed7aa; border-radius:10px; max-height:180px; overflow-y:auto; }
.page-verbal .regulation-list-item { display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:#1e293b; line-height:1.5; }
.page-verbal .reg-num { width:20px; height:20px; border-radius:50%; background:var(--primary); color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.page-verbal .reg-text { flex:1; }
.page-verbal .reg-empty-hint { display:flex; align-items:center; gap:7px; padding:10px 14px; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:8px; font-size:12px; color:#94a3b8; }
.page-verbal .reg-empty-hint i { color:var(--primary); }

/* preview-box / save-status */
.page-verbal .preview-info { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; font-size:13px; color:#1d4ed8; margin-bottom:14px; }
.page-verbal .preview-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; font-size:13px; line-height:2; margin-bottom:14px; }
.page-verbal .preview-box > div { border-bottom:1px dashed #e2e8f0; padding-bottom:4px; }
.page-verbal .preview-box > div:last-child { border-bottom:none; }
.page-verbal .save-status { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:10px; }
.page-verbal .save-status.success { background:#f0fdf4; border:1px solid #86efac; color:#15803d; }
.page-verbal .save-status.error   { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity:0; transform:scale(0.97); }
</style>
