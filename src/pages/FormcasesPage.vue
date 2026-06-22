<!-- FormcasesPage.vue -->
<template>
  <div class="page-discipline" :class="{ 'dark-mode': isDark }">
    <div class="container">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div>
            <h1><i class="fas fa-file-alt"></i> ฟอร์มสร้างใบเดือนพนักงาน</h1>
            <p>กรอกข้อมูลและดำเนินการตามขั้นตอนเพื่อสร้างใบเดือนพนักงาน</p>
          </div>
          <div style="display:flex; gap:8px;">
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

          <!-- DROPDOWN ประเภทเหตุการณ์ -->
          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">
              <i class="fas fa-tag" style="color:var(--primary);margin-right:5px;"></i>
              ประเภทเหตุการณ์
            </label>
            <select class="form-control case-type-select" v-model="caseType">
              <option value="">-- เลือกประเภท --</option>
              <option v-for="opt in caseTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- ID field -->
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

          <hr class="section-divider">

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
                    <transition name="slide-down">
                      <div v-if="step1.damageAsset" class="asset-calc-box">

                        <!-- ✅ เลือกสกุลเงิน (เพิ่ม กีบ) -->
                        <div class="currency-select-bar">
                          <span class="currency-select-label">
                            <i class="fas fa-coins"></i> สกุลเงิน:
                          </span>
                          <!-- บาท -->
                          <label class="currency-option" :class="{active: step1.currencyType === 'baht'}">
                            <input
                              type="checkbox"
                              :checked="step1.currencyType === 'baht'"
                              @change="step1.currencyType = 'baht'"
                              class="currency-cb"
                            >
                            <span class="currency-flag">🇹🇭</span> ບາດ (บาท)
                          </label>
                          <!-- ดอลลาร์ -->
                          <label class="currency-option" :class="{active: step1.currencyType === 'dollar'}">
                            <input
                              type="checkbox"
                              :checked="step1.currencyType === 'dollar'"
                              @change="step1.currencyType = 'dollar'"
                              class="currency-cb"
                            >
                            <span class="currency-flag">🇺🇸</span> ໂດລາ (ดอลลาร์)
                          </label>
                          <!-- ✅ กีบ (ใหม่) -->
                          <label class="currency-option" :class="{active: step1.currencyType === 'kip'}">
                            <input
                              type="checkbox"
                              :checked="step1.currencyType === 'kip'"
                              @change="step1.currencyType = 'kip'"
                              class="currency-cb"
                            >
                            <span class="currency-flag">🇱🇦</span> ກີບ (กีบ)
                          </label>
                          <span
                            class="currency-badge-selected"
                            :class="step1.currencyType === 'dollar' ? 'dollar' : step1.currencyType === 'kip' ? 'kip' : 'baht'"
                          >
                            {{ step1.currencyType === 'dollar' ? '✓ ໂດລາ $' : step1.currencyType === 'kip' ? '✓ ກີບ ₭' : '✓ ບາດ ฿' }}
                          </span>
                        </div>

                        <!-- ✅ โหมด กีบ: ป้อนกีบโดยตรง -->
                        <template v-if="step1.currencyType === 'kip'">
                          <div class="calc-row-label">ຄິດໄລ່ຄ່າເສຍຫາຍ (ກີບ)</div>
                          <div class="calc-grid-row" style="grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="calc-cell">
                              <label class="calc-cell-label">ປ້ອນຈຳນວນເງິນກີບ (₭)</label>
                              <input
                                type="text"
                                class="form-control calc-input"
                                :value="formatNumber(step1.amountKipDirect)"
                                @input="e => step1.amountKipDirect = unformat(e.target.value)"
                                @keypress="allowNumberOnly"
                                placeholder="0"
                                inputmode="numeric"
                              >
                            </div>
                            <div class="calc-cell">
                              <label class="calc-cell-label">ป้อนจำนวนงวด (ງວດ)</label>
                              <input type="number" class="form-control calc-input" v-model="step1.installments" placeholder="1" min="1">
                            </div>
                          </div>
                          <div class="calc-result-row" style="margin-top:10px;">
                            <div class="calc-equal-box" v-if="perInstallmentKip > 0">
                              <span class="calc-equal-label">= ງວດລະ</span>
                              <span class="calc-equal-value">{{ perInstallmentKip.toLocaleString() }}</span>
                              <span class="calc-equal-unit">ກີບ / งวด</span>
                            </div>
                            <div class="calc-equal-box calc-equal-empty" v-else>
                              <span style="color:#94a3b8;font-size:12px;">ผลลัพธ์ต่องวดจะแสดงที่นี่</span>
                            </div>
                            <div class="calc-date-field">
                              <label class="calc-cell-label">จ่ายงวดวันที</label>
                              <input type="date" class="form-control calc-input" v-model="step1.payDate">
                            </div>
                          </div>
                          <div v-if="totalKip > 0" class="calc-summary">
                            <i class="fas fa-check-circle"></i>
                            <span>
                              <strong>{{ formatNumber(step1.amountKipDirect) }} ກີບ</strong>
                              <template v-if="step1.installments > 1"> ÷ <strong>{{ step1.installments }} ງວດ</strong> = งวดละ <strong>{{ perInstallmentKip.toLocaleString() }} ກີບ</strong></template>
                            </span>
                          </div>
                        </template>

                        <!-- ✅ โหมด บาท / ดอลลาร์: เหมือนเดิม -->
                        <template v-else>
                          <div class="calc-row-label">ຄິດໄລ່ຄ່າເສຍຫາຍ</div>
                          <div class="calc-grid-row">
                            <div class="calc-cell">
                              <label class="calc-cell-label">
                                ป้อนจำนวนเงิน ({{ step1.currencyType === 'dollar' ? 'ໂດລາ $' : 'ບາດ ฿' }})
                              </label>
                              <input
                                type="text"
                                class="form-control calc-input"
                                :value="formatNumber(step1.amountBaht)"
                                @input="e => step1.amountBaht = unformat(e.target.value)"
                                @keypress="allowNumberOnly"
                                placeholder="0"
                                inputmode="numeric"
                              >
                            </div>
                            <div class="calc-oper-cell">
                              <span class="calc-oper-badge calc-oper-percent">ຄູນ %</span>
                            </div>
                            <div class="calc-cell">
                              <label class="calc-cell-label">เปอร์เซ็นต์ (%)</label>
                              <input type="number" class="form-control calc-input" v-model="step1.percent" placeholder="0" min="0" max="100" step="1">
                            </div>
                          </div>
                          <div class="calc-result-percent" v-if="amountAfterPercent > 0">
                            <i class="fas fa-percent"></i>
                            <span>
                              ຈຳນວນເງິນຫຼັງຫານ {{ step1.percent || 0 }}% =
                              <strong>{{ amountAfterPercent.toLocaleString() }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }}</strong>
                            </span>
                          </div>
                          <div class="calc-grid-row" style="margin-top:10px;">
                            <div class="calc-cell">
                              <label class="calc-cell-label">
                                ຈຳນວນເງິນຫຼັງຄູນ % ({{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }})
                              </label>
                              <input type="text" class="form-control calc-input calc-result"
                                :value="amountAfterPercent > 0 ? amountAfterPercent.toLocaleString() + (step1.currencyType === 'dollar' ? ' ໂດລາ' : ' ບາດ') : ''"
                                readonly>
                            </div>
                            <div class="calc-oper-cell">
                              <span class="calc-oper-badge">ຄູນ ×</span>
                            </div>
                            <div class="calc-cell">
                              <label class="calc-cell-label">(ອັດຕາແລກປ່ຽນ)</label>
                              <input type="number" class="form-control calc-input" v-model="step1.rateKip" placeholder="0" min="0">
                            </div>
                          </div>
                          <div class="calc-grid-row" style="margin-top:10px;">
                            <div class="calc-cell">
                              <label class="calc-cell-label">ຈຳນວນເງິນກີບ</label>
                              <input type="text" class="form-control calc-input calc-result"
                                :value="totalKip > 0 ? totalKip.toLocaleString() + ' ກີບ' : ''"
                                readonly placeholder="คำนวณอัตโนมัติ">
                            </div>
                            <div class="calc-oper-cell">
                              <span class="calc-oper-badge calc-oper-div">ຫານ ÷</span>
                            </div>
                            <div class="calc-cell">
                              <label class="calc-cell-label">ป้อนจำนวนงวด (ງວດ)</label>
                              <input type="number" class="form-control calc-input" v-model="step1.installments" placeholder="1" min="1">
                            </div>
                          </div>
                          <div class="calc-result-row">
                            <div class="calc-equal-box" v-if="perInstallmentKip > 0">
                              <span class="calc-equal-label">= ງວດລະ</span>
                              <span class="calc-equal-value">{{ perInstallmentKip.toLocaleString() }}</span>
                              <span class="calc-equal-unit">ກີບ / งวด</span>
                            </div>
                            <div class="calc-equal-box calc-equal-empty" v-else>
                              <span style="color:#94a3b8;font-size:12px;">ผลลัพธ์ต่องวดจะแสดงที่นี่</span>
                            </div>
                            <div class="calc-date-field">
                              <label class="calc-cell-label">จ่ายงวดวันที</label>
                              <input type="date" class="form-control calc-input" v-model="step1.payDate">
                            </div>
                          </div>
                          <div v-if="totalKip > 0" class="calc-summary">
                            <i class="fas fa-check-circle"></i>
                            <span>
                              <strong>{{ formatNumber(step1.amountBaht) }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }}</strong>
                              <template v-if="step1.percent > 0"> → ຫານ {{ step1.percent }}% = <strong>{{ amountAfterPercent.toLocaleString() }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }}</strong> → </template>
                              × เรด <strong>{{ Number(step1.rateKip||0).toLocaleString() }}</strong>
                              = <strong>{{ totalKip.toLocaleString() }} ກີບ</strong>
                              <template v-if="step1.installments > 1"> ÷ <strong>{{ step1.installments }} ງວດ</strong> = งวดละ <strong>{{ perInstallmentKip.toLocaleString() }} ກີບ</strong></template>
                            </span>
                          </div>
                        </template>

                      </div>
                    </transition>
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

                  <div class="form-group">
                    <label class="form-label" style="color:var(--primary-dark);">
                      <i class="fas fa-scale-balanced" style="margin-right:5px;"></i>
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

                  <div class="form-group" v-if="step2.regulationList && step2.regulationList.length">
                    <label class="form-label" style="color:var(--primary-dark);">
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
                    <label class="form-label">ปะຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</label>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step2.historyTypes" value="never" id="s2never">
                      <label for="s2never" class="cb-label">ບໍ່ເຄີຍ</label>
                    </div>
                    <div class="cb-group">
                      <input type="checkbox" v-model="step2.historyTypes" value="has" id="s2has">
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
                    <div v-if="step2.hrImg" style="margin-top:6px;padding:10px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:8px;">
                      <img :src="step2.hrImg" style="max-height:70px;border:1px solid #ddd;border-radius:6px;display:block;">
                      <span v-if="step2.hrResponsibility" style="font-size:11px;color:#0284c7;margin-top:5px;display:block;font-weight:600;">
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
                    <div class="cb-group"><input type="checkbox" v-model="step3.punish1" id="s3p1"><label for="s3p1" class="cb-label">ຕັກເຕືອນດ້ວຍວາຈາ</label></div>
                    <div class="cb-group"><input type="checkbox" v-model="step3.punish2" id="s3p2"><label for="s3p2" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</label></div>
                    <div class="cb-group"><input type="checkbox" v-model="step3.punish3" id="s3p3"><label for="s3p3" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</label></div>
                    <div class="cb-group"><input type="checkbox" v-model="step3.punish4" id="s3p4"><label for="s3p4" class="cb-label">ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</label></div>
                    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                      <input type="checkbox" v-model="step3.punish5" id="s3p5" style="margin-top:3px;width:16px;height:16px;accent-color:#0ea5e9;flex-shrink:0;cursor:pointer;">
                      <div style="flex:1;">
                        <label for="s3p5" class="cb-label" style="cursor:pointer;">ອື່ນໆ (ເຊັນພະນັກງານ) ...... ເລີກຈ້າງ (HR/MD)</label>
                        <transition name="fade">
                          <div v-if="step3.punish5" style="margin-top:10px;">
                            <label class="form-label" style="font-size:12px;color:#0284c7;margin-bottom:5px;">ระบุรายละเอียด</label>
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
                      <option v-for="doc in docStore.documents" :key="doc.id" :value="doc.id">
                        {{ doc.document_name }}
                      </option>
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
                      <option v-for="doc in docStore.documents" :key="doc.id" :value="doc.id">
                        {{ doc.document_name }}
                      </option>
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

          <!-- STEP 5: Preview & Add to List -->
          <div class="step-card" :class="{active:activeStep===5}" v-show="activeStep===5">
            <div class="step-header" @click="toggleStep(5)">
              <div class="step-badge" style="background:#f59e0b;"><i class="fas fa-eye"></i></div>
              <div class="step-title">ข้อมูลของเอกสาร (Preview)</div>
              <i class="fas fa-chevron-down step-chevron"></i>
            </div>
            <div class="step-body">
              <div class="preview-info">
                <i class="fas fa-info-circle"></i>
                ตรวจสอบข้อมูลของคุณก่อนยืนยัน ก่อนเพิ่มรายการ
              </div>
              <div class="preview-box">
                <div v-if="caseType"><strong>ประเภทเหตุการณ์:</strong>
                  <span class="preview-badge-type">{{ caseType }}</span>
                </div>
                <div v-if="emp.name"><strong>ผู้กระทำความผิด:</strong> {{ emp.name }}</div>
                <div v-if="emp.code"><strong>ID:</strong> {{ emp.code }}</div>
                <div v-if="emp.dept"><strong>ตำแหน่ง:</strong> {{ emp.dept }}</div>
                <div v-if="emp.startDate"><strong>วันที่เกิดเหตุ:</strong> {{ emp.startDate }}</div>
                <div v-if="emp.location"><strong>สถานที่เกิดเหตุ:</strong> {{ emp.location }}</div>
                <div v-if="emp.witness"><strong>ผู้รู้เห็นเหตุการณ์:</strong> {{ emp.witness }}</div>
                <div v-if="emp.witnessCode"><strong>ID พยาน:</strong> {{ emp.witnessCode }}</div>
                <div v-if="emp.damageValue"><strong>ความเสียหาย:</strong> {{ emp.damageValue }}</div>
                <div v-if="emp.damage"><strong>เรื่อง:</strong> {{ emp.damage }}</div>
                <div v-if="emp.damageDetail"><strong>รายละเอียด:</strong> {{ emp.damageDetail }}</div>
                <div v-if="step2.regulationTypeName"><strong>ประเภทกฎระเบียบ:</strong> {{ step2.regulationTypeName }}</div>
                <div v-if="step2.regulationList && step2.regulationList.length">
                  <strong>รายการกฎระเบียบ:</strong>
                  <div v-for="(r, i) in step2.regulationList" :key="i" style="padding-left:12px;font-size:12px;">{{ i+1 }}. {{ r.name }}</div>
                </div>
                <!-- ✅ แสดงสกุลเงินที่เลือก -->
                <div v-if="step1.damageAsset">
                  <strong>สกุลเงิน:</strong>
                  <span
                    :class="step1.currencyType === 'dollar' ? 'currency-preview-dollar' : step1.currencyType === 'kip' ? 'currency-preview-kip' : 'currency-preview-baht'"
                  >
                    {{ step1.currencyType === 'dollar' ? '🇺🇸 ໂດລາ (ดอลลาร์)' : step1.currencyType === 'kip' ? '🇱🇦 ກີບ (กีบ)' : '🇹🇭 ບາດ (บาท)' }}
                  </span>
                </div>
                <div v-if="step1.damageAsset && totalKip > 0" style="margin-top:8px;padding:10px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;">
                  <strong>ສ່ວນທີ 5 (ຍິນຍອມຊົດໃຊ້):</strong><br>
                  <!-- กีบโดยตรง -->
                  <template v-if="step1.currencyType === 'kip'">
                    ຈຳນວນເງິນທັງໝົດ: <strong>{{ totalKip.toLocaleString() }} ກີບ</strong><br>
                  </template>
                  <!-- บาท/ดอลลาร์ -->
                  <template v-else>
                    <template v-if="step1.percent > 0">
                      ມູນຄ່າຈຳນວນເງິນ {{ formatNumber(step1.amountBaht) }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }} x ຄູນ {{ step1.percent }}% = <strong>{{ amountAfterPercent.toLocaleString() }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }}</strong><br>
                    </template>
                    ຈຳນວນເງິນທັງໝົດ: <strong>{{ totalKip.toLocaleString() }} ກີບ</strong>
                    <template v-if="step1.amountBaht"> / <strong>{{ formatNumber(step1.amountBaht) }} {{ step1.currencyType === 'dollar' ? 'ໂດລາ' : 'ບາດ' }}</strong></template><br>
                  </template>
                  <template v-if="step1.installments > 1">ແບ່ງ <strong>{{ step1.installments }} ງວດ</strong> — ງວດລະ <strong>{{ perInstallmentKip.toLocaleString() }} ກີບ</strong><br></template>
                  <template v-if="step1.payDate">ເລີ່ມຊຳລະ: <strong>{{ step1.payDate }}</strong></template>
                </div>
                <div v-if="step2.historyTypes && step2.historyTypes.length"><strong>ປະຫວັດ:</strong> {{ step2.historyTypes.includes('never') ? 'ບໍ່ເຄີຍ' : '' }}{{ step2.historyTypes.includes('has') ? (step2.historyTypes.includes('never') ? ', ' : '') + 'ເຄີຍຖຶກໂທດທາງວິໄນ' : '' }}</div>
                <div v-if="step2.hrName"><strong>HR:</strong> {{ step2.hrName }} <span v-if="step2.hrResponsibility">({{ step2.hrResponsibility }})</span></div>
                <div v-if="step3.witness1Name"><strong>ພະຍານ:</strong> {{ step3.witness1Name }} — {{ step3.witness1Detail }}</div>
                <div v-if="step3.witness2Name"><strong>ຮັກສາການ:</strong> {{ step3.witness2Name }} — {{ step3.witness2Detail }}</div>
                <div v-if="step3.punish5 && step3.punish5Text"><strong>ອື່ນໆ:</strong> {{ step3.punish5Text }}</div>
                <div v-if="!emp.name && !emp.code && !caseType" style="color:#94a3b8;text-align:center;padding-top:30px;">
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
                <button v-if="!isEditMode" class="btn btn-gray btn-sm" @click="resetAll"><i class="fas fa-undo"></i> เริ่มใหม่</button>
                
                <button v-if="isEditMode" class="btn btn-primary btn-lg" @click="saveEditAndPrint" :disabled="isPrintingAll">
                  <i :class="isPrintingAll ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                  {{ isPrintingAll ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขและพิมพ์' }}
                </button>
                <button v-else class="btn btn-success btn-lg" @click="addToList" :disabled="isAdding">
                  <i :class="isAdding ? 'fas fa-spinner fa-spin' : 'fas fa-plus-circle'"></i>
                  {{ isAdding ? 'กำลังบันทึก...' : 'เพิ่มรายการ' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ===== CASE LIST TABLE ===== -->
      <div v-if="!isEditMode && caseList.length > 0" class="case-list-section">
        <div class="case-list-header">
          <i class="fas fa-list-alt"></i>
          <h3>รายการที่เพิ่มแล้ว</h3>
          <span class="case-count-badge">{{ caseList.length }} รายการ</span>
          <div class="case-list-actions">
            <button
              class="btn btn-success btn-sm"
              @click="printAllFromList"
              :disabled="isPrintingAll || caseList.length === 0"
              title="บันทึกและพิมพ์ทั้งหมด"
            >
              <i :class="isPrintingAll ? 'fas fa-spinner fa-spin' : 'fas fa-print'"></i>
              {{ isPrintingAll ? 'กำลังพิมพ์ทั้งหมด...' : 'บันทึกและพิมพ์ทั้งหมด' }}
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="case-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ประเภท</th>
                <th>ชื่อพนักงาน</th>
                <th>ID</th>
                <th>ตำแหน่ง</th>
                <th>วันที่เกิดเหตุ</th>
                <th>เรื่อง</th>
                <th>การลงโทษ</th>
                <th>จำนวนเงิน</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in caseList" :key="idx">
                <td class="td-no">{{ idx + 1 }}</td>
                <td>
                  <span v-if="row.caseType" class="preview-badge-type">{{ row.caseType }}</span>
                  <span v-else style="color:#94a3b8;">-</span>
                </td>
                <td class="td-name">{{ row.emp.name || '-' }}</td>
                <td class="td-id">{{ row.emp.code || '-' }}</td>
                <td>{{ row.emp.dept || '-' }}</td>
                <td class="td-date">{{ row.emp.startDate || '-' }}</td>
                <td>{{ row.emp.damage || '-' }}</td>
                <td class="td-punish">
                  <span v-if="row.step3.punish1" class="punish-tag">วาจา</span>
                  <span v-if="row.step3.punish2" class="punish-tag">หนังสือ(1)</span>
                  <span v-if="row.step3.punish3" class="punish-tag">หนังสือ(2)</span>
                  <span v-if="row.step3.punish4" class="punish-tag punish-warn">หนังสือ(3)</span>
                  <span v-if="row.step3.punish5" class="punish-tag punish-danger">{{ row.step3.punish5Text || 'อื่นๆ' }}</span>
                  <span v-if="!row.step3.punish1&&!row.step3.punish2&&!row.step3.punish3&&!row.step3.punish4&&!row.step3.punish5" style="color:#94a3b8;">-</span>
                </td>
                <td class="td-amount">
                  <span v-if="row.totalKip > 0" class="amount-kip">{{ row.totalKip.toLocaleString() }} ກີບ</span>
                  <span v-else style="color:#94a3b8;">-</span>
                </td>
                <td class="td-action">
                  <div style="display:flex;gap:6px;align-items:center;">
                    <button
                      class="btn btn-success btn-sm"
                      @click="printFromList(row, idx)"
                      :disabled="row.isPrinting || isPrintingAll"
                      title="บันทึกและพิมพ์เอกสาร"
                    >
                      <i :class="row.isPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-print'"></i>
                      {{ row.isPrinting ? 'กำลังพิมพ์...' : 'บันทึกและพิมพ์' }}
                    </button>
                    <button
                      class="btn btn-danger-outline btn-sm"
                      @click="removeFromList(idx)"
                      title="ลบรายการ"
                    >
                      <i class="fas fa-trash-alt"></i>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useEmployeeStore }     from '@/stores/Useemployeestore'
import { useSignatureStore }    from '@/stores/Usesignaturestore'
import { useDocumentTypeStore } from '@/stores/Usedocumenttypestore'
import { useDisciplineStore }   from '../stores/Usedisciplinestore'
import { useRegulationTypeStore } from '../stores/regulation_type.store'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { supabase } from '@/services/supabase'

const auth = useAuthStore()

// Dark Mode
const isDark = ref(false)
function applyDark(on) {
  isDark.value = on
  try { localStorage.setItem('formcases_darkmode', on ? '1' : '0') } catch { /* ignore storage errors */ }
}

// Stores
const empStore        = useEmployeeStore()
const sigStore        = useSignatureStore()
const docStore        = useDocumentTypeStore()
const disciplineStore = useDisciplineStore()
const regStore        = useRegulationTypeStore()

const router = useRouter()
const route  = useRoute()
const openVerbPage = () => router.push('/warning-history')

const editId = computed(() => route.query?.id ? String(route.query.id) : '')
const isEditMode = computed(() => !!editId.value)

onMounted(() => {
  sigStore.getSignatures()
  docStore.getDocuments()
  regStore.getRegulationTypes()
  try {
    if (localStorage.getItem('formcases_darkmode') === '1') applyDark(true)
  } catch { /* ignore storage errors */ }
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

// Suggestions
const suggestions        = ref([])
const witnessSuggestions = ref([])
let searchTimer  = null
let witnessTimer = null

// Employee data
const emp = ref({
  code: '', name: '', dept: '', damage: '',
  startDate: '', location: '',
  witness: '', witnessCode: '',
  damageDetail: '', damageValue: '',
  investigator: ''
})

const caseType = ref('')
const caseTypeOptions = [
  { value: 'ຈອດແຊ',     label: 'ຈອດແຊ (จอดแซ)' },
  { value: 'ອູປະຕຶເຫດ', label: 'ອູປະຕຶເຫດ (อุบัติเหตุ)' },
  { value: 'Excess',    label: 'Excess' },
  { value: 'ຂາດງານ',   label: 'ຂາດງານ (ขาดงาน)' },
]

const activeStep = ref(1)
const isAdding   = ref(false)
const isPrintingAll = ref(false)
const saveStatus = ref(null)

// ===== CASE LIST =====
const caseList = ref([])

const step1 = ref({
  damagePersonal: false,
  damageAsset: false,
  damageOther: false,
  rateKip: '',
  amountBaht: '',
  percent: 0,
  installments: '',
  payDate: '',
  currencyType: 'baht',   // 'baht' | 'dollar' | 'kip'
  amountKipDirect: '',    // ✅ ใช้เมื่อ currencyType === 'kip'
})

const step2 = ref({
  hasViolation: false,
  historyTypes: [],
  hrId: null, hrName: '', hrResponsibility: '', hrImg: '',
  regulationTypeId:   null,
  regulationTypeName: '',
  regulationList:     [],
})

const step3 = ref({
  punish1: false, punish2: false, punish3: false,
  punish4: false, punish5: false, punish5Text: '',
  witness1Id: null, witness1Name: '', witness1Detail: '',
  witness2Id: null, witness2Name: '', witness2Detail: '',
})

const step4 = ref({
  amountBaht: '', amountKip: '', payDate: '', installment: '',
  chairman: '', viceChairman: '', committee1: '', committee2: '', committee3: '', secretary: ''
})

const step5 = ref({
  address: '', idCard: '', totalDamage: '', deductAmount: '', hrApprover: '', investigator: ''
})

const matchSignatureId = (name, img) => {
  const found = sigStore.signatures.find(s => (name && s.signature_name === name) || (img && s.signature_image === img))
  return found?.id ?? null
}

const matchDocId = (docName, detail) => {
  const found = docStore.documents.find(d => (docName && d.document_name === docName && (!detail || d.detail === detail)))
  return found?.id ?? null
}

const matchRegTypeIdByName = (name) => {
  const found = regStore.regulation_types.find(r => r.regulation_type_name === name)
  return found?.id ?? null
}

const loadCaseForEdit = async (id) => {
  if (!id) return
  try {
    const { data, error } = await supabase.from('discipline_cases').select('*').eq('id', id).single()
    if (error) throw error

    emp.value = {
      code: data.employee_code || '',
      name: data.employee_name || '',
      dept: data.position || '',
      damage: data.subject || '',
      startDate: data.incident_date || '',
      location: data.incident_location || '',
      witness: data.witness_name || '',
      witnessCode: data.witness_code || '',
      damageDetail: data.detail || '',
      damageValue: data.damage_value || '',
      investigator: data.investigator || ''
    }

    caseType.value = data.case_type || ''

    const savedCurrencyType = data.currency_type || 'baht'
    step1.value = {
      damagePersonal: (data.damage_types || []).includes('personal'),
      damageAsset: (data.damage_types || []).includes('asset'),
      damageOther: (data.damage_types || []).includes('other'),
      rateKip: data.rate_kip || '',
      amountBaht: data.amount_baht || '',
      percent: data.percent || 0,
      installments: data.installments || '',
      payDate: data.pay_date || '',
      currencyType: savedCurrencyType,
      // ✅ โหลด amountKipDirect ถ้าเป็น kip mode
      amountKipDirect: savedCurrencyType === 'kip' ? (data.amount_kip_direct || data.total_kip || '') : '',
    }

    step2.value = {
      hasViolation: !!data.has_violation,
      historyTypes: [],
      hrId: matchSignatureId(data.hr_name, data.hr_image),
      hrName: data.hr_name || '',
      hrResponsibility: data.hr_responsibility || '',
      hrImg: data.hr_image || '',
      regulationTypeId: matchRegTypeIdByName(data.regulation_type_name || ''),
      regulationTypeName: data.regulation_type_name || '',
      regulationList: Array.isArray(data.regulation_list) ? data.regulation_list : [],
      historyType: data.history_type || 'never',
      historyNever: String(data.history_type || 'never') !== 'has',
      historyHas: String(data.history_type || 'never') === 'has'
    }

    const p = data.punish_types || []
    step3.value = {
      punish1: p.includes('verbal'),
      punish2: p.includes('written1'),
      punish3: p.includes('written2'),
      punish4: p.includes('written3'),
      punish5: p.includes('other'),
      punish5Text: data.punish_other_text || '',
      witness1Id: matchDocId(data.witness1_name, data.witness1_detail),
      witness1Name: data.witness1_name || '',
      witness1Detail: data.witness1_detail || '',
      witness2Id: matchDocId(data.witness2_name, data.witness2_detail),
      witness2Name: data.witness2_name || '',
      witness2Detail: data.witness2_detail || '',
    }

    step4.value = {
      amountBaht: '', amountKip: '', payDate: '', installment: '',
      chairman: data.commission_chairman || '',
      viceChairman: data.commission_vice_chairman || '',
      committee1: data.commission_committee1 || '',
      committee2: data.commission_committee2 || '',
      committee3: data.commission_committee3 || '',
      secretary: data.commission_secretary || ''
    }

    step5.value = {
      address: data.address || '',
      idCard: data.id_card || '',
      totalDamage: data.total_damage || '',
      deductAmount: data.deduct_amount || '',
      hrApprover: data.hr_approver || '',
      investigator: data.hr_approver_name || ''
    }

    activeStep.value = 1
  } catch (err) {
    window.Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#ef4444', confirmButtonText: 'ตกลง' })
  }
}

// ✅ Handler เปลี่ยนประเภทกฎระเบียบ
const onRegulationTypeChange = () => {
  const found = regStore.regulation_types.find(r => r.id === step2.value.regulationTypeId)
  if (found) {
    step2.value.regulationTypeName = found.regulation_type_name || ''
    step2.value.regulationList     = Array.isArray(found.regulation_list)
                                      ? found.regulation_list
                                      : []
  } else {
    step2.value.regulationTypeName = ''
    step2.value.regulationList     = []
  }
}

// ✅ amountAfterPercent — ใช้เฉพาะ baht/dollar mode
const amountAfterPercent = computed(() => {
  if (step1.value.currencyType === 'kip') return 0
  const baht    = parseFloat(step1.value.amountBaht) || 0
  const percent = parseFloat(step1.value.percent)    || 0
  if (percent <= 0) return baht
  return baht * (percent / 100)
})

// ✅ totalKip — รองรับ 3 โหมด
const totalKip = computed(() => {
  if (step1.value.currencyType === 'kip') {
    // โหมดกีบ: ป้อนตรง
    return parseFloat(step1.value.amountKipDirect) || 0
  }
  // โหมดบาท/ดอลลาร์: คำนวณจาก rate
  const base = amountAfterPercent.value
  const rate = parseFloat(step1.value.rateKip) || 0
  return base * rate
})

const perInstallmentKip = computed(() => {
  const t = totalKip.value
  const i = parseFloat(step1.value.installments) || 0
  if (i <= 0 || t <= 0) return 0
  return Math.round(t / i)
})

const selectHR = () => {
  const found = sigStore.signatures.find(s => s.id === step2.value.hrId)
  if (found) {
    step2.value.hrName           = found.signature_name
    step2.value.hrImg            = found.signature_image
    step2.value.hrResponsibility = found.responsibility || ''
  } else {
    step2.value.hrName = ''; step2.value.hrImg = ''; step2.value.hrResponsibility = ''
  }
}

const selectDoc = (field) => {
  let id = null
  if (field === 'witness1') id = step3.value.witness1Id
  if (field === 'witness2') id = step3.value.witness2Id
  const found = docStore.documents.find(d => d.id === id)
  if (field === 'witness1') {
    step3.value.witness1Name   = found ? (found.document_name || '') : ''
    step3.value.witness1Detail = found ? (found.detail || '') : ''
  }
  if (field === 'witness2') {
    step3.value.witness2Name   = found ? (found.document_name || '') : ''
    step3.value.witness2Detail = found ? (found.detail || '') : ''
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
  emp.value.code = item.employee_code
  emp.value.name = item.fullname
  emp.value.dept = item.department
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
  emp.value.witnessCode    = item.employee_code
  emp.value.witness        = item.fullname
  witnessSuggestions.value = []
}

const closeSuggestDelay = (type) => {
  setTimeout(() => {
    if (type === 'emp')     suggestions.value        = []
    if (type === 'witness') witnessSuggestions.value = []
  }, 200)
}

watch(() => emp.value.code, (val) => {
  if (!val || val.trim() === '') {
    emp.value.name = ''; emp.value.dept = ''; emp.value.startDate = ''; suggestions.value = []
  }
})
watch(() => emp.value.witnessCode, (val) => {
  if (!val || val.trim() === '') { emp.value.witness = ''; witnessSuggestions.value = [] }
})

const formatNumber  = (val) => {
  if (!val && val !== 0) return ''
  const num = String(val).replace(/[^0-9]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString()
}
const unformat      = (val) => val.replace(/[^0-9]/g, '')
const allowNumberOnly = (e) => { if (!/[0-9]/.test(e.key)) e.preventDefault() }

const toggleStep   = (step) => { if (activeStep.value !== step) activeStep.value = step }
const completeStep = (step) => { activeStep.value = step + 1 }

const resetAll = () => {
  activeStep.value = 1
  saveStatus.value = null
  caseType.value = ''
  emp.value   = { code:'', name:'', dept:'', damage:'', startDate:'', location:'', witness:'', witnessCode:'', damageDetail:'', damageValue:'', investigator:'' }
  step1.value = { damagePersonal:false, damageAsset:false, damageOther:false, rateKip:'', amountBaht:'', percent:0, installments:'', payDate:'', currencyType:'baht', amountKipDirect:'' }
  step2.value = {
    hasViolation:false, historyTypes:[],
    hrId:null, hrName:'', hrResponsibility:'', hrImg:'',
    regulationTypeId: null, regulationTypeName: '', regulationList: [],
  }
  step3.value = {
    punish1:false, punish2:false, punish3:false, punish4:false, punish5:false, punish5Text:'',
    witness1Id:null, witness1Name:'', witness1Detail:'',
    witness2Id:null, witness2Name:'', witness2Detail:'',
  }
  step4.value = { amountBaht:'', amountKip:'', payDate:'', installment:'', chairman:'', viceChairman:'', committee1:'', committee2:'', committee3:'', secretary:'' }
  step5.value = { address:'', idCard:'', totalDamage:'', deductAmount:'', hrApprover:'', investigator:'' }
  suggestions.value = []; witnessSuggestions.value = []
}

const resetEmployeeIdentityOnly = () => {
  activeStep.value = 1
  emp.value.code = ''
  emp.value.name = ''
  emp.value.dept = ''
  suggestions.value = []
}

// ==================== เพิ่มรายการ ====================
const addToList = async () => {
  if (!emp.value.code) {
    window.Swal.fire({
      title: 'แจ้งเตือน',
      text: 'กรุณาเลือกพนักงานก่อนครับ',
      icon: 'warning',
      confirmButtonColor: '#0ea5e9',
      confirmButtonText: 'ตกลง',
    })
    return
  }

  isAdding.value = true
  saveStatus.value = null

  try {
    const addedEmployeeName = emp.value.name
    const snapshot = {
      caseType:           caseType.value,
      emp:                { ...emp.value },
      step1:              { ...step1.value },
      step2:              { ...step2.value, regulationList: [...(step2.value.regulationList || [])] },
      step3:              { ...step3.value },
      step4:              { ...step4.value },
      step5:              { ...step5.value },
      totalKip:           totalKip.value,
      amountAfterPercent: amountAfterPercent.value,
      perInstallmentKip:  perInstallmentKip.value,
      isPrinting:         false,
    }

    caseList.value.push(snapshot)
    saveStatus.value = { type: 'success', message: `เพิ่ม "${addedEmployeeName}" เข้ารายการแล้ว` }

    window.Swal.fire({
      title: 'เพิ่มรายการสำเร็จ!',
      text: `เพิ่ม ${addedEmployeeName} เข้ารายการแล้ว สามารถกดพิมพ์ได้ที่ตารางด้านล่าง`,
      icon: 'success',
      confirmButtonColor: '#0ea5e9',
      confirmButtonText: 'ตกลง',
      timer: 2500,
      timerProgressBar: true,
    })

    resetEmployeeIdentityOnly()

  } catch (err) {
    console.error('Error:', err)
    saveStatus.value = { type: 'error', message: 'เกิดข้อผิดพลาด: ' + err.message }
  } finally {
    isAdding.value = false
  }
}

// ==================== ลบรายการ ====================
const removeFromList = (idx) => {
  window.Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'ต้องการลบรายการนี้ออกจากรายการหรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
  }).then((result) => {
    if (result.isConfirmed) {
      caseList.value.splice(idx, 1)
    }
  })
}

const PRINT_LOGO_1 = 'https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg'
const PRINT_LOGO_2 = 'https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png'

const toBase64 = async (url) => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

const openPrintFrame = (htmlContent) => {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;height:297mm;border:none;'
  document.body.appendChild(iframe)
  iframe.contentDocument.open()
  iframe.contentDocument.write(htmlContent)
  iframe.contentDocument.close()
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 500)
  }
}

const combinePrintDocuments = (documents) => {
  if (!documents.length) return ''
  const styleBlock = documents[0].match(/<style>[\s\S]*?<\/style>/i)?.[0] || ''
  const bodyContents = documents.map((doc) => doc.match(/<body>([\s\S]*?)<\/body>/i)?.[1] || '')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${styleBlock}</head><body>${bodyContents.join('')}</body></html>`
}

const saveAndBuildPrintHtml = async (row) => {
  const [logo1, logo2, hrImgB64] = await Promise.all([
    toBase64(PRINT_LOGO_1).catch(() => ''),
    toBase64(PRINT_LOGO_2).catch(() => ''),
    row.step2.hrImg ? toBase64(row.step2.hrImg).catch(() => '') : Promise.resolve('')
  ])

  const result = await disciplineStore.saveCase({
    emp:                row.emp,
    step1:              row.step1,
    step2:              row.step2,
    step3:              row.step3,
    step4:              row.step4,
    step5:              row.step5,
    totalKip:           row.totalKip,
    amountAfterPercent: row.amountAfterPercent,
    created_by:         auth.session?.fullname || auth.session?.username || null,
    created_at:         new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    case_type:          row.caseType || null,
    percent:            row.step1.percent || 0,
    history_type:       row.step2.historyTypes.join(','),
    currency_type:      row.step1.currencyType || 'baht',
    // ✅ ส่ง amountKipDirect ด้วย
    amount_kip_direct:  row.step1.currencyType === 'kip' ? (parseFloat(row.step1.amountKipDirect) || null) : null,
  })

  if (!result.success) throw new Error(result.error)

  let htmlContent = buildPrintHTML(row)
  htmlContent = htmlContent
    .replace(PRINT_LOGO_1, logo1)
    .replace(PRINT_LOGO_2, logo2)

  if (row.step2.hrImg && hrImgB64) {
    htmlContent = htmlContent.replaceAll(row.step2.hrImg, hrImgB64)
  }

  return htmlContent
}

// ==================== พิมพ์จากรายการ ====================
const printFromList = async (row, idx) => {
  row.isPrinting = true
  try {
    const htmlContent = await saveAndBuildPrintHtml(row)

    resetAll()
    if (typeof idx === 'number' && idx >= 0) {
      caseList.value.splice(idx, 1)
    }

    openPrintFrame(htmlContent)

  } catch (err) {
    console.error('Error:', err)
    window.Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: err.message,
      icon: 'error',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ตกลง',
    })
  } finally {
    row.isPrinting = false
  }
}

// ==================== บันทึกการแก้ไขและพิมพ์ ====================
const updateCaseFallback = async (id, payload) => {
  const { data, error } = await supabase.from('discipline_cases').update(payload).eq('id', id).select().single()
  if (error) throw error
  return { success: true, data }
}

const saveEditAndPrint = async () => {
  isPrintingAll.value = true
  try {
    const rowData = {
      emp:                JSON.parse(JSON.stringify(emp.value)),
      caseType:           caseType.value,
      step1:              JSON.parse(JSON.stringify(step1.value)),
      step2:              JSON.parse(JSON.stringify(step2.value)),
      step3:              JSON.parse(JSON.stringify(step3.value)),
      step4:              JSON.parse(JSON.stringify(step4.value)),
      step5:              JSON.parse(JSON.stringify(step5.value)),
      totalKip:           totalKip.value,
      amountAfterPercent: amountAfterPercent.value,
      perInstallmentKip:  perInstallmentKip.value,
    }

    const [logo1, logo2, hrImgB64] = await Promise.all([
      toBase64(PRINT_LOGO_1).catch(() => ''),
      toBase64(PRINT_LOGO_2).catch(() => ''),
      rowData.step2.hrImg ? toBase64(rowData.step2.hrImg).catch(() => '') : Promise.resolve('')
    ])

    const payload = {
      emp:                rowData.emp,
      step1:              rowData.step1,
      step2:              rowData.step2,
      step3:              rowData.step3,
      step4:              rowData.step4,
      step5:              rowData.step5,
      totalKip:           rowData.totalKip,
      amountAfterPercent: rowData.amountAfterPercent,
      case_type:          rowData.caseType || null,
      percent:            rowData.step1.percent || 0,
      history_type:       rowData.step2.historyTypes.join(','),
      currency_type:      rowData.step1.currencyType || 'baht',
    }

    let result
    if (typeof disciplineStore.updateCase === 'function') {
      result = await disciplineStore.updateCase(editId.value, payload)
    } else {
      const punishTypes = []
      if (payload.step3.punish1) punishTypes.push('verbal')
      if (payload.step3.punish2) punishTypes.push('written1')
      if (payload.step3.punish3) punishTypes.push('written2')
      if (payload.step3.punish4) punishTypes.push('written3')
      if (payload.step3.punish5) punishTypes.push('other')

      const damageTypes = []
      if (payload.step1.damagePersonal) damageTypes.push('personal')
      if (payload.step1.damageAsset)    damageTypes.push('asset')
      if (payload.step1.damageOther)    damageTypes.push('other')

      result = await updateCaseFallback(editId.value, {
        employee_code:     payload.emp.code     || null,
        employee_name:     payload.emp.name     || null,
        position:          payload.emp.dept     || null,
        incident_date:     payload.emp.startDate || null,
        incident_location: payload.emp.location || null,
        witness_code:      payload.emp.witnessCode || null,
        witness_name:      payload.emp.witness  || null,
        damage_value:      payload.emp.damageValue || null,
        subject:           payload.emp.damage   || null,
        detail:            payload.emp.damageDetail || null,
        investigator:      payload.emp.investigator || null,

        damage_types: damageTypes,
        amount_baht:  payload.step1.amountBaht ? Number(payload.step1.amountBaht) : null,
        currency_type: payload.currency_type || 'baht',
        // ✅ บันทึก amountKipDirect
        amount_kip_direct: payload.step1.currencyType === 'kip' ? (parseFloat(payload.step1.amountKipDirect) || null) : null,
        percent: payload.percent !== undefined && payload.percent !== null && payload.percent !== ''
            ? Number(payload.percent)
            : (payload.step1.percent !== undefined && payload.step1.percent !== null && payload.step1.percent !== '' ? Number(payload.step1.percent) : null),
        amount_after_percent: payload.amountAfterPercent != null ? Number(payload.amountAfterPercent) : null,
        rate_kip:     payload.step1.rateKip     ? Number(payload.step1.rateKip)     : null,
        total_kip:    payload.totalKip          || null,
        installments: payload.step1.installments ? Number(payload.step1.installments) : null,
        pay_date:     payload.step1.payDate     || null,

        has_violation: payload.step2.hasViolation || false,
        history_type:  payload.history_type || 'never',
        hr_name:       payload.step2.hrName || null,
        hr_image:      payload.step2.hrImg  || null,
        hr_responsibility: payload.step2.hrResponsibility || null,
        regulation_type_id:   payload.step2.regulationTypeId   || null,
        regulation_type_name: payload.step2.regulationTypeName || null,
        regulation_list:      payload.step2.regulationList     || [],

        punish_types:      punishTypes,
        punish_other_text: payload.step3.punish5Text || null,
        witness1_name:     payload.step3.witness1Name   || null,
        witness1_detail:   payload.step3.witness1Detail || null,
        witness2_name:     payload.step3.witness2Name   || null,
        witness2_detail:   payload.step3.witness2Detail || null,

        commission_chairman:      payload.step4?.chairman     || null,
        commission_vice_chairman: payload.step4?.viceChairman || null,
        commission_committee1:    payload.step4?.committee1   || null,
        commission_committee2:    payload.step4?.committee2   || null,
        commission_committee3:    payload.step4?.committee3   || null,
        commission_secretary:     payload.step4?.secretary    || null,

        address:       payload.step5?.address      || null,
        id_card:       payload.step5?.idCard       || null,
        total_damage:  payload.step5?.totalDamage  ? Number(payload.step5.totalDamage)  : null,
        deduct_amount: payload.step5?.deductAmount ? Number(payload.step5.deductAmount) : null,
        hr_approver:      payload.step5?.hrApprover   || null,
        hr_approver_name: payload.step5?.investigator || null,

        case_type:  payload.case_type  || null,
      })
    }

    if (!result.success) throw new Error(result.error || 'Update failed')

    saveStatus.value = { type: 'success', message: 'แก้ไขสำเร็จ!' }

    let htmlContent = buildPrintHTML(rowData)
    htmlContent = htmlContent
      .replace(PRINT_LOGO_1, logo1)
      .replace(PRINT_LOGO_2, logo2)

    if (rowData.step2.hrImg && hrImgB64) {
      htmlContent = htmlContent.replaceAll(rowData.step2.hrImg, hrImgB64)
    }

    openPrintFrame(htmlContent)

    setTimeout(() => {
      router.push('/warning-history')
    }, 2000)

  } catch (err) {
    console.error('Edit Error:', err)
    window.Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: err.message,
      icon: 'error',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ตกลง',
    })
  } finally {
    isPrintingAll.value = false
  }
}

const printAllFromList = async () => {
  if (!caseList.value.length) return

  isPrintingAll.value = true
  const rows = [...caseList.value]
  const printedIndexes = []
  const printDocuments = []
  const failedNames = []

  try {
    for (const [idx, row] of rows.entries()) {
      row.isPrinting = true
      try {
        const htmlContent = await saveAndBuildPrintHtml(row)
        printDocuments.push(htmlContent)
        printedIndexes.push(idx)
      } catch (err) {
        failedNames.push(row.emp?.name || row.emp?.code || `รายการที่ ${idx + 1}`)
        console.error('Bulk print error:', err)
      } finally {
        row.isPrinting = false
      }
    }

    if (!printDocuments.length) {
      throw new Error('ไม่สามารถบันทึกและพิมพ์รายการใดได้')
    }

    const printedSet = new Set(printedIndexes)
    const remainingRows = caseList.value.filter((_, idx) => !printedSet.has(idx))
    const combinedHtml = combinePrintDocuments(printDocuments)

    resetAll()
    caseList.value = remainingRows
    openPrintFrame(combinedHtml)

    if (failedNames.length) {
      saveStatus.value = {
        type: 'error',
        message: `พิมพ์สำเร็จ ${printDocuments.length} รายการ และยังเหลือ ${failedNames.length} รายการที่ต้องตรวจสอบ`,
      }
    } else {
      saveStatus.value = {
        type: 'success',
        message: `บันทึกและพิมพ์ทั้งหมดสำเร็จ ${printDocuments.length} รายการ`,
      }
    }
  } catch (err) {
    console.error('Error:', err)
    window.Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: err.message,
      icon: 'error',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ตกลง',
    })
  } finally {
    isPrintingAll.value = false
  }
}

// ==================== ฟังก์ชันแปลงวันที่ (ลาว) ====================
const formatLaoDate = (dateStr) => {
  if (!dateStr) return '____/____/______'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year  = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day   = parseInt(parts[2], 10)
  const months = [
    'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
    'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
  ]
  return `${day} ${months[month-1]} ${year}`
}

// ==================== Build Print HTML จาก snapshot row ====================
const buildPrintHTML = (row) => {
  const empName          = row.emp.name         || '_________________'
  const empCode          = row.emp.code         || '_________________'
  const empDept          = row.emp.dept         || '_________________'
  const empDamage        = row.emp.damage       || ''
  const empDetail        = row.emp.damageDetail || ''
  const empDateFormatted = formatLaoDate(row.emp.startDate || '')
  const empLocation      = row.emp.location     || '_________________'
  const empWitness       = row.emp.witness      || '_________________'
  const empWitnessCode   = row.emp.witnessCode  || ''
  const damageVal        = row.emp.damageValue  || ''
  const caseTypeVal      = row.caseType         || ''
  const investigator     = row.emp.investigator || '_________________'

  // ✅ สกุลเงิน — รองรับ kip
  const currType    = row.step1.currencyType || 'baht'
  const currLabelPrint = currType === 'dollar' ? 'ໂດລາ' : currType === 'kip' ? 'ກີບ' : 'ບາດ'
  const currSymbol  = currType === 'dollar' ? '$' : currType === 'kip' ? '₭' : '฿'

  const hasPersonal = row.step1.damagePersonal
  const hasAsset    = row.step1.damageAsset
  const hasOther    = row.step1.damageOther

  const hasViol     = row.step2.hasViolation
  const neverPunish = row.step2.historyTypes.includes('never')
  const hasPunish   = row.step2.historyTypes.includes('has')
  const hrName      = row.step2.hrName           || '_________________'
  const hrResponsib = row.step2.hrResponsibility || 'ພະຍານHR'
  const hrImgSrc    = row.step2.hrImg

  const regulationList     = row.step2.regulationList     || []
  const regulationTypeName = row.step2.regulationTypeName || ''

  const witness1Name   = row.step3.witness1Name   || '_________________'
  const witness1Detail = row.step3.witness1Detail  || ''
  const witness2Name   = row.step3.witness2Name   || '_________________'
  const witness2Detail = row.step3.witness2Detail  || 'ຮັກສາການຜູ້ຈັດການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ'
  const punish5Text    = row.step3.punish5Text    || ''

  // ✅ คำนวณตัวเลขสำหรับพิมพ์ — รองรับ kip mode
  const amountBahtNum          = parseFloat(row.step1.amountBaht) || 0
  const percentNum             = parseFloat(row.step1.percent) || 0
  const amountAfterPercentNum  = row.amountAfterPercent || 0
  const amtAfterPercentDisplay = amountAfterPercentNum.toLocaleString()

  // กีบ mode: ใช้ amountKipDirect เป็น "จำนวนเงิน" ที่แสดงในส่วน 5
  const isKipMode = currType === 'kip'
  const amtKip       = row.totalKip > 0 ? row.totalKip.toLocaleString() : ''
  // จำนวนเงินต้น (ก่อนแปลง) สำหรับแสดงในส่วน 5
  const displayAmountOrig = isKipMode
    ? (parseFloat(row.step1.amountKipDirect) || 0).toLocaleString()
    : amountBahtNum.toLocaleString()

  const installment  = row.step1.installments || ''
  const perInstall   = row.perInstallmentKip > 0 ? row.perInstallmentKip.toLocaleString() : ''
  const payDateFormatted = formatLaoDate(row.step1.payDate || '')

  const chairman  = row.step4.chairman     || ''
  const viceChair = row.step4.viceChairman || ''
  const comm1     = row.step4.committee1   || ''
  const comm2     = row.step4.committee2   || ''
  const comm3     = row.step4.committee3   || ''
  const secretary = row.step4.secretary    || ''
  const address   = row.step5.address      || ''

  const chk = (v) => v
    ? `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;">✓</span>`
    : `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`

  const hrSigBox = `<span style="border-bottom:1px solid #888;display:inline-flex;align-items:flex-end;justify-content:center;width:150px;min-height:68px;overflow:hidden;flex-shrink:0;">
    ${hrImgSrc ? `<img src="${hrImgSrc}" style="max-width:148px;max-height:66px;width:auto;height:auto;object-fit:contain;object-position:center bottom;display:block;">` : ''}
  </span>`

  const docSigBlock = (name, detail) => `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(${name}) ${detail}</div>
    </div>`

  const punisherSigBlock = `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:250px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(_________________) ຜູ້ມີອຳນາດຕັກເຕືອນ</div>
    </div>`

  const punish5Label = row.step3.punish5
    ? `ອື່ນໆ (ເຊັນພະນັກງານ)&nbsp;<span style="display:inline-block;min-width:90px;border-bottom:1.5px solid #222;padding:0 4px;font-weight:700;">${punish5Text}</span>&nbsp;ເລີກຈ້າງ (HR/MD)`
    : `ອື່ນໆ (ເຊັນພະນັກງານ)..............................................ເລີກຈ້າງ (HR/MD)`

  const kipLine1 = row.totalKip > 0 ? row.totalKip.toLocaleString() : ''
  const assetSubRows = `
    <div class="sub-row"><span class="sub-num">1</span><span class="sub-line">${kipLine1}</span><span class="sub-unit">ກີບ</span></div>
    <div class="sub-row"><span class="sub-num">2</span><span class="sub-line"></span><span class="sub-unit"></span></div>
  `

  const titleText = `ໜັງສືໃບເຕືອນ${caseTypeVal ? ` ${caseTypeVal}` : ''}`

  // ✅ ส่วนที่ 5: แสดง % line เฉพาะ baht/dollar mode
  const percentLine = (!isKipMode && percentNum > 0 && amountBahtNum > 0)
    ? `<div style="margin-bottom:6px;line-height:1.8;">
         ມູນຄ່າຈຳນວນເງິນ ${displayAmountOrig} ${currLabelPrint} x ຄູນ ${percentNum}% ເທົ່າກັບຈຳນວນເງິນ ${amtAfterPercentDisplay} ${currLabelPrint}
       </div>`
    : ''

  // ✅ ส่วน 5 สรุปยอด — kip mode แสดงต่างจาก baht/dollar
  const s5AmountDisplay = isKipMode
    ? amtKip   // กีบโดยตรง
    : amtAfterPercentDisplay

  const regulationRowsHTML = regulationList.length
    ? regulationList.map((item, idx) =>
        `<div class="item-row" style="padding-left:4px;">
          <span><strong>${idx + 1}.</strong> ${item.name}</span>
        </div>`
      ).join('')
    : `<div class="item-row" style="padding-left:4px;font-size:9px;color:#888;">— ບໍ່ໄດ້ລະບຸລະບຽບ —</div>`

  const regulationTypeLabel = regulationTypeName
    ? `<div class="item-row" style="padding-left:4px;font-weight:700;"></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>${titleText}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif;font-size:11px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
  .page-inner{display:flex;flex-direction:column;padding:6mm 9mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;page-break-after:always;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:4px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:1fr 1px 1fr;}
  .col-left{padding:5px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:5px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:4px;}
  .info-row{display:flex;align-items:baseline;gap:4px;margin-bottom:5px;flex-wrap:wrap;}
  .info-label{font-weight:600;white-space:nowrap;}
  .info-value{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .info-id-label{font-weight:600;white-space:nowrap;margin-left:8px;}
  .info-id-value{border-bottom:1px solid #888;min-width:70px;text-align:left;padding-bottom:2px;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;}
  .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;padding-top:1px;}
  .fv-md{width:90px;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:2px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .sub-row{display:flex;align-items:center;gap:4px;margin-bottom:3px;padding-left:16px;flex-wrap:nowrap;}
  .sub-num{min-width:12px;flex-shrink:0;}
  .sub-line{flex:1;border-bottom:1px solid #888;min-height:15px;padding-left:4px;font-weight:700;white-space:nowrap;overflow-x:auto;}
  .sub-unit{padding-left:3px;flex-shrink:0;white-space:nowrap;}
  .bottom-section{border-top:1px solid #999;padding:4px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:2px;}
  .sign-row{display:flex;justify-content:space-between;gap:10px;}
  .sign-item{flex:1;text-align:center;font-size:10px;line-height:1.9;}
  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s2-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:3px;line-height:1.5;font-size:10.5px;}
  .chk{width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
  .chk-lg{width:12px;height:12px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;margin-top:1px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:4px 0;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10.5px;line-height:1.9;padding:4px 10px;}
  .s4-body{display:grid;grid-template-columns:1fr 1px 1fr;border:1px solid #999;border-top:none;}
  .s4-left{padding:5px 10px;}
  .s4-div{background:#999;}
  .s4-right{padding:5px 10px;}
  .s5-body{border:1px solid #999;border-top:none;padding:7px 12px;}
  .currency-badge-print{display:inline-block;padding:0 2px;border-radius:0;font-size:9.5px;font-weight:700;margin-left:4px;border:none;background:transparent;}
  .currency-badge-baht{background:transparent;color:#000;border:none;}
  .currency-badge-dollar{background:transparent;color:#000;border:none;}
  .currency-badge-kip{background:transparent;color:#000;border:none;}
</style></head><body>

<div class="page"><div class="page-inner">
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">
      <img src="https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg" style="height:28px;width:auto;object-fit:contain;">
      <img src="https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png" style="height:28px;width:auto;object-fit:contain;">
    </div>
    <div class="doc-title">${titleText}</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>

  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div style="border:1px solid #999;border-top:none;">
    <div class="two-col-grid">
      <div class="col-left">
        <div class="info-row">
          <span class="info-label">ຜູ້ກະທຳຄວາມຜິດ</span><span>:</span>
          <span class="info-value">${empName}</span>
          <span class="info-id-label">ID</span><span>:</span>
          <span class="info-id-value">${empCode}</span>
        </div>
        <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
        <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDateFormatted}</span></div>
        <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ:</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
        <div class="info-row">
          <span class="info-label">ບຸກຄົນທີ່ຮູ້ເຫດການ:</span><span>:</span>
          <span class="info-value">${empWitness}</span>
          <span class="info-id-label">ID</span><span>:</span>
          <span class="info-id-value">${empWitnessCode}</span>
        </div>
        <div class="field-row"><span class="fl-w">ລາຍງານເສຍຫາຍ</span><span class="fc">:</span><span class="fve">${damageVal}</span></div>
        <div style="margin-top:4px;">
          <div class="cb-row">${chk(hasPersonal)}<span style="font-size:10.5px;">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</span></div>
          <div class="cb-row">${chk(hasAsset)}<span style="font-size:10.5px;">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</span></div>
          ${assetSubRows}
          <div class="cb-row" style="margin-top:3px;">${chk(hasOther)}<span style="font-size:10.5px;">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</span></div>
        </div>
      </div>
      <div class="col-divider"></div>
      <div class="col-right">
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ເລື່ອງ:</span>
          <span style="font-size:11px;flex:1;border-bottom:1px solid #ddd;padding-bottom:2px;padding-left:3px;">${empDamage}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ລາຍລະອຽດເຫດການ:</span>
          <span style="font-size:11px;flex:1;line-height:1.7;padding-left:3px;">${empDetail}</span>
        </div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;margin-top:10px;">
        <div>${docSigBlock(investigator, 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
        <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
      </div>
    </div>
  </div>

  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈາລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ້ 3 ວິໄນພະນັກງານ</span></div>
      ${regulationTypeLabel}
      ${regulationRowsHTML}
      <div style="font-size:9.5px;color:#333;padding-left:4px;">ຈຶ່ງແຈ້ງປະໂຫຍດດ້ວຍຕົນເອງ ແລະ ໃຫ້ທ່ານຮັບຊາບ ແລະ ຄຳນຶງດ້ວຍຕົວທ່ານເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
        <span class="chk-lg">${neverPunish ? '✓' : ''}</span><span>ບໍ່ເຄີຍ</span>&nbsp;
        <span class="chk-lg">${hasPunish ? '✓' : ''}</span><span>ເຄີຍຖຶກໂທດທາງວິໄນ</span>
      </div>
      <hr class="hr-thin">
      <div style="font-size:10px;margin-top:4px;">
        <div style="display:flex;align-items:flex-end;gap:6px;line-height:1;">
          <span style="white-space:nowrap;line-height:1;min-width:70px;">ລົງຊື່ :</span>
          ${hrSigBox}
        </div>
        <div style="margin-top:2px;margin-left:calc(70px + 6px);width:150px;text-align:center;font-size:9.5px;line-height:1.15;word-break:break-word;">
          (${hrName || '____________________'})
        </div>
      </div>
    </div>
  </div>

  <div class="section-bar">ສ່ວນທີ 3 ການລົງໂທດ (ພິຈາລະນາຮ່ວມກັບຝ່າຍບຸກຄົນ)</div>
  <div class="s3-wrap">
    <div class="s3-left">
      <div class="item-row"><span>ເຫັນສົມຄວນໃຫ້ລົງໂທດວິໄນ</span></div>
      <div class="item-row">${chk(row.step3.punish1)}<span>ຕັກເຕືອນດ້ວຍວາຈາ</span></div>
      <div class="item-row">${chk(row.step3.punish2)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</span></div>
      <div class="item-row">${chk(row.step3.punish3)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</span></div>
      <div class="item-row">${chk(row.step3.punish4)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</span></div>
      <div class="item-row">${chk(row.step3.punish5)}<span>${punish5Label}</span></div>
    </div>
    <div class="s3-right" style="justify-content:center;align-items:center;text-align:center;">
      <div style="font-size:10px;line-height:1.8;">
        <div>ອຳນາດການລົງໂທດວິໄນຕາມຂໍ້ບັງຄັບ</div>
        <div>ກຳມະການຜູ້ຈັດການ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ລະພະແນກເປັນຜູ້ໂທດ ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:3px;color:#c00;font-weight:700;font-size:9.5px;">****ກໍລະນີເລີກຈ້າງສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>

  <div class="sig-block">
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:6px;">
      ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລີກຈ້າງໂດຍບໍ່ຈ່າຍຄ່າຊົດເຊີຍ
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
      <div style="margin-bottom:6px;">${punisherSigBlock}</div>
      <div style="margin-bottom:6px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${empName}) ພະນັກງານ (ຜູ້ຖືກລົງໂທດ)</div>
      </div>
      <div style="margin-bottom:6px;">${docSigBlock(witness1Name, witness1Detail)}</div>
      <div style="margin-bottom:6px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;min-width:28px;display:inline-block;">ລົງຊື່</span>
          ${hrSigBox}
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="margin-top:2px;margin-left:calc(28px + 3px);width:150px;text-align:center;font-size:10px;line-height:1.15;word-break:break-word;">
          <div>(${hrName || '____________________'})</div>
          <div>${hrResponsib}</div>
        </div>
      </div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8.5px;color:#444;font-style:italic;margin-top:6px;">
      ( ຫາກທ່ານບໍ່ພໍໃຈການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົບບໍລິສັດ )
    </div>
  </div>
</div></div>

<!-- ========== PAGE 2 ========== -->
<div class="page"><div class="page-inner">
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">
      <img src="https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg" style="height:28px;width:auto;object-fit:contain;">
      <img src="https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png" style="height:28px;width:auto;object-fit:contain;">
    </div>
    <div class="doc-title">${titleText}</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>

  <div class="section-bar">ສ່ວນທີ 4 ການແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນ ແລະ ພິຈາລະນາຄວາມຜິດ</div>
  <div style="font-size:10px;color:#444;font-style:italic;padding:4px 10px;border:1px solid #999;border-top:none;border-bottom:none;">
    &nbsp;&nbsp;&nbsp;&nbsp;ເພື່ອໃຫ້ການດຳເນີນການສອບສວນຫາຂໍ້ມູນຈິງສຳຫຼັບຄວາມຜິດທີ່ເກີດຂື້ນ ແລະການພິຈາລະນາໂທດທາງວິໄນເປັນໄປຢ່າງຖຶກຕ້ອງ <br> ແລະ ເກີດຕວາມຍຸດຕິທຳ ຈຶ່ງຂໍອະນຸຍາດແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນແລະພິຈາລະນາຄວາມຜິດ ດັ່ງນີ້:
  </div>
  <div class="s4-body">
    <div class="s4-left">
      ${[['1.',chairman],['2.',viceChair],['3.',comm1],['4.',comm2],['5.',comm3],['6.',secretary]].map(([n,v])=>`
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;font-size:10.5px;min-height:22px;">
        <span style="min-width:14px;font-weight:600;">${n}</span>
        <span style="border-bottom:1px solid #888;flex:1;min-height:15px;padding-bottom:1px;">${v}</span>
      </div>`).join('')}
    </div>
    <div class="s4-div"></div>
    <div class="s4-right">
      <ul style="list-style:none;padding:0;margin:0;">
        ${[
          ['ປະທານຄະນະກຳມະການ','( ຜຈກ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
          ['ຮອງປະທານຄະນະກຳມະການ','( ຜຈກ ໜ່ວຍງານອື່ນ)'],
          ['ເປັນກຳມະການ','( ຫໜ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
          ['ເປັນກຳມະການ','( ຫໜ ໜ່ວຍງານອື່ນ)'],
          ['ເປັນກຳມະການ','( ຫໜ.ໜ່ວຍງານອື່ນ/ຜູ້ດູແລງານ)'],
          ['ກຳມະການເລຂານຸການ','( ສ່ວນຊັບພະຍາກອນບຸກຄົນ)'],
        ].map(([t,d])=>`
        <li style="display:flex;align-items:center;margin-bottom:8px;font-size:10.5px;min-height:22px;">
          <span style="min-width:150px;font-weight:600;white-space:nowrap;">${t}</span>
          <span style="color:#333;font-size:10px;">${d}</span>
        </li>`).join('')}
      </ul>
    </div>
  </div>

  <div style="display:flex;border:1px solid #999;border-top:none;">
    <div style="width:62%;padding:3px 8px;background:#fff;font-weight:700;font-size:10.5px;border-right:1px solid #999;">ຜູ້ສະເໜີ (ຜູ້ບັນຊາຕົ້ນສັງກັດ/ຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div style="width:38%;padding:3px 8px;background:#fff;font-weight:700;font-size:10.5px;">ຜູ້ອະນຸມັດ (ກຳມະການຜູ້ຈັດການ)</div>
  </div>
  <div style="display:flex;border:1px solid #999;border-top:none;margin-bottom:0;">
    <div style="width:62%;padding:10px;border-right:1px solid #999;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:35px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
    </div>
    <div style="width:38%;padding:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:180px; min-height:35px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
    </div>
  </div>

  <!-- ✅ ส่วนที่ 5 — รองรับ kip mode -->
  <div class="section-bar">ສ່ວນທີ 5 ຍິນຍອມຊົດໃຊ້ຄ່າເສຍຫາຍ (ກໍລະນີຊັບສິນຂອງບໍລິສັດເສຍຫາຍ)</div>
  <div class="s5-body">
    <div style="display:flex;justify-content:flex-end;gap:20px;margin-bottom:5px;">
      <span>ທີ: <span style="display:inline-block;">.............................</span></span>
      <span>ວັນທີ: <span style="display:inline-block;">.............................</span></span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ຂ້າພະເຈົ້າ <span style="border-bottom:1px solid #888;display:inline-block;min-width:120px;">&nbsp;${empName}&nbsp;</span>
      &nbsp;(ພະນັກງານຜູ້ກະທຳຄວາມເສຍຫາຍ ເລກບັດປະຊາຊົນ): <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;">&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">
      ທີ່ຢູ່: <span style="border-bottom:1px solid #888;display:inline-block;min-width:200px;">&nbsp;${address}&nbsp;</span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.1)</strong> ຂ້າພະເຈົ້າຍອມຮັບຜິດໃນຄວາມເສຍຫາຍທີ່ເກີດຂື້ນຈາກການຕັ້ງໃຈ ຫຼຶ ຈາກການທີ່ບໍ່ຕັ້ງໃຈ ແລະ ເປັນຜົນເກີດຄວາມເສຍຫາຍ<br> ຕໍ່ຊັບສິນຂອງບໍລິສັດໄດ້ແກ່ ເລື່ອງ:
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:130px;">&nbsp;${empDamage}&nbsp;</span>
    </div>
    ${percentLine}
    <div style="margin-bottom:4px;line-height:1.8;">
      ມູນຄ່າຊັບສິນທີ່ເສຍຫາຍເບື້ອງຕົ້ນ ຄ່າ <span style="color:#000;">${caseTypeVal || 'Excess'}</span>
      <!-- ✅ แสดงจำนวนเงินพร้อมสกุลเงิน -->
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:100px;font-weight:700;">&nbsp;${s5AmountDisplay}&nbsp;</span>
      <span class="currency-badge-print currency-badge-${currType}">${currLabelPrint} ${currSymbol}</span>
      ${isKipMode ? '' : `ຄິດໄລ່ເປັນເງິນກີບ
      ${amtKip ? `(<span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip} ກີບ&nbsp;</span>)` : `(<span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;">&nbsp;&nbsp;</span>)`}`}
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.2)</strong> ຂ້າພະເຈົ້າຍິນຍອມໃຫ້ບໍລິສັດຕັດເງິນຕາມຂໍ້ 5.1) ຈຳນວນ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip}&nbsp;</span>
      ກີບ ອອກຈາກເງິນຄ່າຈ້າງ
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ໂດຍແບ່ງເປັນ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:35px;font-weight:700;">&nbsp;${installment}&nbsp;</span>
      ງວດ, ງວດລະ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${perInstall}&nbsp;</span>
      ກີບ, ຕັ້ງແຕ່ງວດວັນທີ:
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;font-weight:700;">&nbsp;${payDateFormatted}&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">ຫາກຂ້າພະເຈົ້າບໍ່ຍອມຊຳລະ ບໍລິສັດມີສິດດຳເນີນຄະດີຕາມກົດໝາຍ</div>
    <div style="margin-bottom:6px;line-height:1.7;">
      <strong>5.3)</strong> ກໍລະນີທີ່ຂ້າພະເຈົ້າພົ້ນຈາກການເປັນພະນັກງານ ໂດຍຍັງມີສ່ວນທີ່ຄ້າງຊຳລະຄ່າເສຍຫາຍ ຂ້າພະເຈົ້າຍິນດີນຳເງິນມາຊຳລະຕ່າເສຍຫາຍທັງໝົດ <br> ໂດຍໄວທີ່ສູດພາຍໃນ 7 ວັນ ຫຼື ຕາມຕົົກລົງກັນ.
    </div>
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:12px;">
      (ຂ້າພະເຈົ້າໄດ້ອ່ານແລະເຂົ້າໃຈໃນຂໍ້ຄວາມດີແລ້ວ ຈຶ່ງໄດ້ລົງລາຍເຊັນຊື່ໄວ້ເພື່ອເປັນຫຼັກຖານ)
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      <div style="margin-bottom:4px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${witness2Name}) ${witness2Detail}</div>
      </div>
      <div style="margin-bottom:4px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${empName}) ພະນັກງານ</div>
      </div>
      <div>
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;overflow:hidden;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${witness1Name}) ${witness1Detail}</div>
      </div>
      <div>
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;min-width:28px;display:inline-block;">ລົງຊື່</span>
          ${hrSigBox}
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="margin-top:2px;margin-left:calc(28px + 3px);width:150px;text-align:center;font-size:10px;line-height:1.15;word-break:break-word;">
          <div>(${hrName || '____________________'})</div>
          <div>${hrResponsib}</div>
        </div>
      </div>
    </div>
  </div>
</div></div>

</body></html>`
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; }
.page-discipline {
  --primary:#0ea5e9; --primary-dark:#0284c7; --primary-light:#f0f9ff; --primary-border:#bae6fd;
  --success:#10b981; --success-light:#f0fdf4; --success-border:#86efac; --success-dark:#15803d;
  --danger:#ef4444; --dark:#1e293b; --gray:#64748b;
  --border:#d1d5db; --bg:#f8f9fa; --white:#fff;
  --radius:12px; --shadow:0 2px 8px rgba(0,0,0,0.08);
}
.page-discipline .calc-result-percent {
  margin-top: 8px; padding: 8px 12px; background: #e0f2fe;
  border-radius: 8px; font-size: 12px; color: #0284c7;
  display: flex; align-items: center; gap: 8px;
}
.page-discipline .calc-oper-percent { background: #f59e0b; }

/* ✅ Currency Select Bar */
.page-discipline .currency-select-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 14px; padding: 10px 14px;
  background: #fff; border: 1.5px solid var(--primary-border);
  border-radius: 10px;
}
.page-discipline .currency-select-label {
  font-size: 12px; font-weight: 700; color: var(--primary-dark);
  white-space: nowrap; display: flex; align-items: center; gap: 5px;
}
.page-discipline .currency-option {
  display: flex; align-items: center; gap: 7px;
  cursor: pointer; font-size: 13px; font-weight: 600; color: #1e293b;
  padding: 5px 10px; border-radius: 8px; border: 1.5px solid transparent;
  transition: all 0.2s;
}
.page-discipline .currency-option.active {
  border-color: var(--primary); background: var(--primary-light);
}
.page-discipline .currency-cb {
  width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; flex-shrink: 0;
}
.page-discipline .currency-flag { font-size: 16px; }
.page-discipline .currency-badge-selected {
  margin-left: auto; padding: 3px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 700; white-space: nowrap;
}
.page-discipline .currency-badge-selected.baht {
  background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc;
}
.page-discipline .currency-badge-selected.dollar {
  background: #d1fae5; color: #15803d; border: 1px solid #6ee7b7;
}
/* ✅ กีบ badge */
.page-discipline .currency-badge-selected.kip {
  background: #fef9c3; color: #854d0e; border: 1px solid #fde047;
}

/* ✅ Preview currency badge */
.page-discipline .currency-preview-baht {
  display: inline-block; background: #e0f2fe; color: #0284c7;
  border: 1px solid #7dd3fc; border-radius: 6px; padding: 1px 10px;
  font-size: 12px; font-weight: 700; margin-left: 6px;
}
.page-discipline .currency-preview-dollar {
  display: inline-block; background: #d1fae5; color: #15803d;
  border: 1px solid #6ee7b7; border-radius: 6px; padding: 1px 10px;
  font-size: 12px; font-weight: 700; margin-left: 6px;
}
/* ✅ กีบ preview badge */
.page-discipline .currency-preview-kip {
  display: inline-block; background: #fef9c3; color: #854d0e;
  border: 1px solid #fde047; border-radius: 6px; padding: 1px 10px;
  font-size: 12px; font-weight: 700; margin-left: 6px;
}

.page-discipline body, .page-discipline { background:var(--bg); min-height:100vh; padding:20px; color:var(--dark); font-size:14px; }
.page-discipline .container { max-width:1400px; margin:0 auto; }
.page-discipline .page-header { background:var(--white); padding:25px 30px; border-radius:var(--radius); margin-bottom:25px; box-shadow:var(--shadow); border-left:5px solid var(--primary); }
.page-discipline .page-header h1 { font-size:26px; font-weight:700; color:var(--dark); margin-bottom:4px; display:flex; align-items:center; gap:12px; }
.page-discipline .page-header h1 i { color:var(--primary); }
.page-discipline .page-header p { color:var(--gray); font-size:14px; }
.page-discipline .main-grid { display:grid; grid-template-columns:430px 1fr; gap:20px; align-items:start; }
.page-discipline .card { background:var(--white); border-radius:var(--radius); padding:25px; box-shadow:var(--shadow); border:1px solid var(--primary-border); }
.page-discipline .card-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid #f1f5f9; }
.page-discipline .card-header h3 { font-size:17px; font-weight:600; color:var(--dark); }
.page-discipline .card-header i { font-size:20px; color:var(--primary); }
.page-discipline .form-group { margin-bottom:14px; }
.page-discipline .form-label { display:block; margin-bottom:6px; font-weight:600; color:var(--dark); font-size:13px; }
.page-discipline .form-control { width:100%; padding:10px 14px; border:1px solid var(--border); border-radius:8px; font-size:14px; transition:all 0.2s; background:var(--white); font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; outline:none; }
.page-discipline .form-control:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(14,165,233,0.12); }
.page-discipline .form-control.auto-filled { background:var(--primary-light)!important; border-left:3px solid var(--primary)!important; }
.page-discipline textarea.form-control { resize:vertical; min-height:80px; }
.page-discipline .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.page-discipline .search-wrap { position:relative; }
.page-discipline .search-wrap .form-control { padding-right:42px; }
.page-discipline .search-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:none; color:var(--primary); font-size:15px; cursor:pointer; padding:4px 6px; border-radius:6px; }
.page-discipline .search-btn:hover { background:var(--primary-light); }
.page-discipline .suggest-dropdown { position:absolute; top:calc(100% + 2px); left:0; right:0; background:#fff; border:1.5px solid var(--primary-border); border-radius:10px; box-shadow:0 8px 24px rgba(14,165,233,0.15); z-index:999; max-height:220px; overflow-y:auto; }
.page-discipline .suggest-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; font-size:13px; border-bottom:1px solid #f1f5f9; transition:background 0.15s; }
.page-discipline .suggest-item:last-child { border-bottom:none; }
.page-discipline .suggest-item:hover { background:var(--primary-light); }
.page-discipline .suggest-code { font-weight:700; color:var(--primary-dark); min-width:90px; font-size:12px; background:#e0f2fe; padding:2px 7px; border-radius:5px; }
.page-discipline .suggest-name { flex:1; font-weight:600; color:#1e293b; }
.page-discipline .suggest-dept { font-size:11px; color:#64748b; white-space:nowrap; }
.page-discipline .sig-preview-box { margin-top:8px; padding:10px 14px; background:#f0f9ff; border:1.5px solid var(--primary-border); border-radius:10px; font-size:12px; color:#1e293b; }
.page-discipline .sig-preview-line { display:flex; align-items:center; gap:6px; font-weight:600; color:#374151; margin-bottom:4px; }
.page-discipline .sig-preview-blank { display:inline-block; width:110px; border-bottom:1.5px solid #64748b; min-height:18px; }
.page-discipline .sig-preview-label { font-size:11px; color:var(--primary-dark); font-weight:600; padding-left:2px; }
.page-discipline .btn { padding:11px 22px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:8px; font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif; transition:all 0.2s; }
.page-discipline .btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
.page-discipline .btn:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
.page-discipline .btn-primary { background:var(--primary); color:var(--white); }
.page-discipline .btn-success { background:var(--success); color:var(--white); }
.page-discipline .btn-gray    { background:#e2e8f0; color:#475569; }
.page-discipline .btn-danger-outline { background:#fff0f0; color:#ef4444; border:1.5px solid #fca5a5; }
.page-discipline .btn-danger-outline:hover { background:#fef2f2; }
.page-discipline .btn-sm      { padding:8px 16px; font-size:13px; }
.page-discipline .btn-lg      { padding:14px 28px; font-size:15px; }
.page-discipline .info-badge { display:inline-flex; align-items:center; gap:8px; padding:10px 15px; background:var(--primary-light); border-left:3px solid var(--primary); border-radius:8px; font-size:13px; color:var(--primary-dark); width:100%; }
.page-discipline .action-row { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid #f1f5f9; }
.page-discipline .right-panel { display:flex; flex-direction:column; gap:16px; }
.page-discipline .step-card { background:var(--white); border-radius:var(--radius); box-shadow:var(--shadow); border:1px solid var(--primary-border); overflow:hidden; }
.page-discipline .step-header { padding:16px 22px; border-bottom:2px solid #f1f5f9; display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none; }
.page-discipline .step-badge { width:32px; height:32px; border-radius:50%; background:var(--primary); color:var(--white); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; }
.page-discipline .step-title { font-size:15px; font-weight:700; color:var(--dark); flex:1; }
.page-discipline .step-chevron { color:#94a3b8; font-size:13px; transition:transform 0.25s; }
.page-discipline .step-card.active .step-chevron { transform:rotate(180deg); }
.page-discipline .step-body { padding:22px 25px; display:none; }
.page-discipline .step-card.active .step-body { display:block; }
.page-discipline .two-col { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
.page-discipline .cb-group { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
.page-discipline .cb-group input[type="checkbox"], .page-discipline .cb-group input[type="radio"] { margin-top:3px; width:16px; height:16px; accent-color:var(--primary); flex-shrink:0; cursor:pointer; }
.page-discipline .cb-label { font-size:13px; color:#374151; line-height:1.6; }
.page-discipline .asset-calc-box { margin-left:26px; margin-top:6px; padding:16px; background:#f0f9ff; border:1.5px solid var(--primary-border); border-radius:12px; margin-bottom:10px; }
.page-discipline .calc-row-label { font-size:12px; font-weight:700; color:var(--primary-dark); margin-bottom:12px; }
.page-discipline .calc-grid-row { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px; }
.page-discipline .calc-cell { background:var(--white); border:1.5px solid var(--primary-border); border-radius:10px; padding:10px 12px; }
.page-discipline .calc-cell-label { display:block; font-size:11px; font-weight:700; color:var(--primary-dark); margin-bottom:6px; }
.page-discipline .calc-oper-cell { display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.page-discipline .calc-oper-badge { background:var(--primary); color:var(--white); font-size:12px; font-weight:800; padding:6px 10px; border-radius:8px; white-space:nowrap; }
.page-discipline .calc-oper-div { background:#f59e0b; }
.page-discipline .calc-input { padding:8px 10px !important; font-size:13px !important; width:100%; }
.page-discipline .calc-result { background:#e0f2fe !important; color:var(--primary-dark) !important; font-weight:700 !important; border-color:var(--primary) !important; cursor:default !important; }
.page-discipline .calc-result-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
.page-discipline .calc-equal-box { background:var(--success-light); border:2px solid var(--success-border); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:8px; min-height:52px; }
.page-discipline .calc-equal-empty { background:#f8fafc; border-color:#e2e8f0; justify-content:center; }
.page-discipline .calc-equal-label { font-size:11px; font-weight:700; color:var(--success-dark); white-space:nowrap; }
.page-discipline .calc-equal-value { font-size:20px; font-weight:800; color:var(--success-dark); flex:1; text-align:right; }
.page-discipline .calc-equal-unit { font-size:10px; font-weight:600; color:var(--success); white-space:nowrap; padding-left:4px; }
.page-discipline .calc-date-field { background:var(--white); border:1.5px solid var(--primary-border); border-radius:10px; padding:10px 12px; }
.page-discipline .calc-summary { display:flex; align-items:center; gap:8px; background:var(--success-light); border:1px solid var(--success-border); border-radius:8px; padding:8px 12px; font-size:12px; color:var(--success-dark); margin-top:10px; }
.page-discipline .calc-summary i { color:var(--success); flex-shrink:0; }
.page-discipline .slide-down-enter-active { transition:all 0.3s ease; max-height:700px; }
.page-discipline .slide-down-leave-active { transition:all 0.2s ease; }
.page-discipline .slide-down-enter-from  { max-height:0; opacity:0; transform:translateY(-8px); overflow:hidden; }
.page-discipline .slide-down-leave-to   { max-height:0; opacity:0; overflow:hidden; }
.page-discipline .punish5-input { border:1.5px solid var(--primary) !important; background:var(--primary-light) !important; }
.page-discipline .punish5-preview { margin-top:8px; padding:9px 13px; background:#f0fdf4; border:1px solid #86efac; border-left:3px solid #10b981; border-radius:8px; font-size:12px; color:#166534; line-height:1.7; }
.page-discipline .fade-enter-active, .page-discipline .fade-leave-active { transition:opacity 0.2s, transform 0.2s; }
.page-discipline .fade-enter-from, .page-discipline .fade-leave-to { opacity:0; transform:translateY(-6px); }
.page-discipline .preview-info { background:var(--primary-light); border-left:3px solid var(--primary); border-radius:8px; padding:10px 16px; font-size:13px; color:var(--primary-dark); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.page-discipline .preview-box { background:#f8fafc; border:1px solid var(--primary-border); border-radius:8px; padding:18px; min-height:120px; font-size:13px; line-height:2; color:#374151; }
.page-discipline .section-divider { border:none; border-top:1.5px solid #f1f5f9; margin:6px 0 14px 0; }
.page-discipline .save-status { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:8px; font-size:13px; font-weight:600; margin-top:14px; }
.page-discipline .save-status.success { background:var(--success-light); border:1px solid var(--success-border); color:var(--success-dark); }
.page-discipline .save-status.error   { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
.page-discipline .case-type-select { cursor:pointer; font-weight:600; color:var(--primary-dark); border-color:var(--primary-border); background-color:var(--primary-light); }
.page-discipline .case-type-select:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(14,165,233,0.12); }
.page-discipline .case-type-select option { font-weight:normal; color:#1e293b; background:#fff; }
.page-discipline .preview-badge-type { display:inline-block; background:#e0f2fe; border:1px solid #7dd3fc; color:#0284c7; border-radius:6px; padding:1px 10px; font-size:12px; font-weight:700; margin-left:6px; }

/* Regulation list */
.page-discipline .regulation-list-box {
  display: flex; flex-direction: column; gap: 5px;
  padding: 10px 12px; background: var(--primary-light);
  border: 1.5px solid var(--primary-border); border-radius: 10px;
  max-height: 200px; overflow-y: auto;
}
.page-discipline .regulation-list-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12.5px; color: #1e293b; line-height: 1.5;
}
.page-discipline .reg-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--primary); color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.page-discipline .reg-text { flex: 1; }
.page-discipline .reg-empty-hint {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 14px; background: #f8fafc;
  border: 1.5px dashed #cbd5e1; border-radius: 8px;
  font-size: 12px; color: #94a3b8;
}
.page-discipline .reg-empty-hint i { color: var(--primary); }

/* Case list table */
.page-discipline .case-list-section { margin-top: 28px; background: var(--white); border-radius: var(--radius); padding: 22px 26px; box-shadow: var(--shadow); border: 1px solid var(--primary-border); }
.page-discipline .case-list-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #f1f5f9; flex-wrap: wrap; }
.page-discipline .case-list-header h3 { font-size: 17px; font-weight: 700; color: var(--dark); }
.page-discipline .case-list-header i  { font-size: 20px; color: var(--primary); }
.page-discipline .case-list-actions { margin-left: auto; display: flex; gap: 8px; }
.page-discipline .case-count-badge { background: var(--primary); color: #fff; border-radius: 999px; font-size: 12px; font-weight: 700; padding: 2px 12px; margin-left: 2px; }
.page-discipline .table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; }
.page-discipline .case-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
.page-discipline .case-table th { background: var(--primary-light); color: var(--primary-dark); font-weight: 700; padding: 11px 13px; text-align: left; border-bottom: 2px solid var(--primary-border); white-space: nowrap; }
.page-discipline .case-table td { padding: 10px 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #374151; }
.page-discipline .case-table tr:last-child td { border-bottom: none; }
.page-discipline .case-table tr:hover td { background: #f0f9ff; transition: background 0.15s; }
.page-discipline .td-no { text-align: center; font-weight: 700; color: var(--gray); width: 36px; }
.page-discipline .td-name { font-weight: 600; color: var(--dark); }
.page-discipline .td-id { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 3px 8px !important; border-radius: 5px; white-space: nowrap; }
.page-discipline .td-date { white-space: nowrap; }
.page-discipline .td-punish { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.page-discipline .td-amount { white-space: nowrap; }
.page-discipline .td-action { white-space: nowrap; }
.page-discipline .punish-tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 5px; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
.page-discipline .punish-warn { background: #fef9c3; color: #854d0e; border-color: #fde047; }
.page-discipline .punish-danger { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
.page-discipline .amount-kip { font-weight: 700; color: var(--success-dark); }

@media (max-width:1100px) { .page-discipline .main-grid { grid-template-columns:1fr; } }
@media (max-width:700px) {
  .page-discipline .row-2,.page-discipline .two-col,.page-discipline .calc-grid-row,.page-discipline .calc-result-row { grid-template-columns:1fr; }
  .page-discipline .calc-oper-cell { justify-content:flex-start; }
  .page-discipline .card,.page-discipline .step-body { padding:15px; }
  .page-discipline .currency-select-bar { gap:8px; }
}

/* Dark mode */
.page-discipline.dark-mode {
  --primary:#3b82f6; --primary-dark:#1e40af; --primary-light:#1e40af;
  --border:#374151; --bg:#1a1a2e; --white:#1f2937;
  --dark:#f0f0f0; --gray:#a0aec0;
}
.page-discipline.dark-mode .page-header { background:#2d3748; border-left-color:#3b82f6; }
.page-discipline.dark-mode .card { background:#2d3748; border-color:#374151; }
.page-discipline.dark-mode .form-control { background:#374151; border-color:#4b5563; color:#e5e7eb; }
.page-discipline.dark-mode .form-control::placeholder { color:#9ca3af; }
.page-discipline.dark-mode .form-label { color:#d1d5db; }
.page-discipline.dark-mode .section-divider { border-top-color:#374151; }
.page-discipline.dark-mode .suggest-dropdown { background:#374151; border-color:#4b5563; }
.page-discipline.dark-mode .suggest-item { color:#d1d5db; border-color:#4b5563; }
.page-discipline.dark-mode .suggest-item:hover { background:#4b5563; }
.page-discipline.dark-mode .step-card { background:#2d3748; border-color:#374151; }
.page-discipline.dark-mode .step-body { border-color:#374151; }
.page-discipline.dark-mode .cb-label { color:#d1d5db; }
.page-discipline.dark-mode .asset-calc-box { background:#1a1a2e; border-color:#3b82f6; }
.page-discipline.dark-mode .calc-cell { background:#374151; border-color:#4b5563; color:#d1d5db; }
.page-discipline.dark-mode .preview-box { background:#374151; border-color:#4b5563; color:#d1d5db; }
.page-discipline.dark-mode .info-badge { background:#1e3a8a; color:#bfdbfe; border-left-color:#3b82f6; }
.page-discipline.dark-mode .case-type-select { background:#374151; border-color:#4b5563; color:#93c5fd; }
.page-discipline.dark-mode .case-type-select option { background:#374151; color:#e5e7eb; }
.page-discipline.dark-mode .btn-sm { color:#1a1a2e; }
.page-discipline.dark-mode .save-status { background:#1e293b; border-color:#374151; color:#d1d5db; }
.page-discipline.dark-mode .save-status.success { background:#064e3b; border-color:#059669; color:#d1fae5; }
.page-discipline.dark-mode h1, .page-discipline.dark-mode h3, .page-discipline.dark-mode h4 { color: #e5e7eb; }
.page-discipline.dark-mode p { color: #a0aec0; }
.page-discipline.dark-mode .case-list-section { background:#2d3748; border-color:#374151; }
.page-discipline.dark-mode .case-list-header { border-bottom-color:#374151; }
.page-discipline.dark-mode .table-wrap { border-color:#374151; }
.page-discipline.dark-mode .case-table th { background:#1e3a8a; color:#bfdbfe; border-bottom-color:#374151; }
.page-discipline.dark-mode .case-table td { border-bottom-color:#374151; color:#d1d5db; }
.page-discipline.dark-mode .case-table tr:hover td { background:#1e40af22; }
.page-discipline.dark-mode .td-id { background:#374151; }
.page-discipline.dark-mode .btn-danger-outline { background:#450a0a; color:#fca5a5; border-color:#7f1d1d; }
.page-discipline.dark-mode .regulation-list-box { background:#1e3a8a; border-color:#374151; }
.page-discipline.dark-mode .regulation-list-item { color:#d1d5db; }
.page-discipline.dark-mode .reg-empty-hint { background:#1e293b; border-color:#374151; color:#94a3b8; }
.page-discipline.dark-mode .currency-select-bar { background:#2d3748; border-color:#374151; }
.page-discipline.dark-mode .currency-option { color:#d1d5db; }
.page-discipline.dark-mode .currency-option.active { background:#1e3a8a; border-color:#3b82f6; }

.app-root.dark .page-discipline { background: #0f172a; color: #e5e7eb; }
.app-root.dark .page-discipline .page-header { background: #1a1a2e; border-left-color: #3b82f6; }
.app-root.dark .page-discipline .card { background: #1a1a2e; border-color: #374151; }
.app-root.dark .page-discipline .form-control { background: #2d3748; border-color: #4b5563; color: #e5e7eb; }
.app-root.dark .page-discipline .form-control::placeholder { color: #9ca3af; }
.app-root.dark .page-discipline .form-label { color: #d1d5db; }
.app-root.dark .page-discipline h1, .app-root.dark .page-discipline h3 { color: #e5e7eb; }
.app-root.dark .page-discipline p { color: #a0aec0; }
.app-root.dark .page-discipline .step-card { background: #1a1a2e; border-color: #374151; }
.app-root.dark .page-discipline .section-divider { border-top-color: #374151; }
.app-root.dark .page-discipline .suggest-dropdown { background: #2d3748; border-color: #4b5563; }
.app-root.dark .page-discipline .suggest-item { color: #d1d5db; }
.app-root.dark .page-discipline .suggest-item:hover { background: #374151; }
.app-root.dark .page-discipline .info-badge { background: #1e3a8a; color: #bfdbfe; border-left-color: #3b82f6; }
.app-root.dark .page-discipline .calc-cell { background: #2d3748; border-color: #4b5563; color: #d1d5db; }
.app-root.dark .page-discipline .btn { color: #fff; }
.app-root.dark .page-discipline .case-type-select { background: #2d3748; border-color: #4b5563; color: #93c5fd; }
.app-root.dark .page-discipline .case-list-section { background: #1a1a2e; border-color: #374151; }
.app-root.dark .page-discipline .case-list-header { border-bottom-color: #374151; }
.app-root.dark .page-discipline .table-wrap { border-color: #374151; }
.app-root.dark .page-discipline .case-table th { background: #1e3a8a; color: #bfdbfe; }
.app-root.dark .page-discipline .case-table td { border-bottom-color: #374151; color: #d1d5db; }
.app-root.dark .page-discipline .case-table tr:hover td { background: #1e40af22; }
.app-root.dark .page-discipline .regulation-list-box { background: #1e3a8a; border-color: #374151; }
.app-root.dark .page-discipline .regulation-list-item { color: #d1d5db; }
.app-root.dark .page-discipline .reg-empty-hint { background: #1e293b; border-color: #374151; color: #94a3b8; }
.app-root.dark .page-discipline .currency-select-bar { background: #2d3748; border-color: #374151; }
.app-root.dark .page-discipline .currency-option { color: #d1d5db; }
.app-root.dark .page-discipline .currency-option.active { background: #1e3a8a; border-color: #3b82f6; }
</style>