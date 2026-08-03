import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useVerbalWarningStore = defineStore('verbalWarning', () => {
  const loading = ref(false)
  const error   = ref(null)
  const editingCase = ref(null)

  async function updateCase(id, { emp, step1, step2, step3 }) {
    loading.value = true
    error.value   = null
    try {
      const docType = step3.punishGroup === 'verbal'
        ? 'ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ'
        : 'ໜັງສືຕັກເຕືອນດ້ວຍວິໄນ'

      const { error: updateErr } = await supabase
        .from('verbal_warning_cases')
        .update({
          employee_code:     emp.code,
          employee_name:     emp.name,
          position:          emp.dept,
          incident_date:     emp.startDate,
          incident_location: emp.location,
          witness_code:      emp.witnessCode,
          witness_name:      emp.witness,
          damage_value:      emp.damageValue,
          subject:           emp.damage,
          detail:            JSON.stringify({
            text: emp.damageDetail || '',
            reg_type: step2.regulationTypeName || '',
            reg_list: step2.regulationList || []
          }),
          damage_personal:   step1.damagePersonal,
          damage_asset:      step1.damageAsset,
          damage_other:      step1.damageOther,
          has_violation:     step2.hasViolation,
          history_type:      step2.historyType,
          hr_name:           step2.hrName,
          hr_image:          step2.hrImg,
          hr_responsibility: step2.hrResponsibility,
          doc_type:          docType,
          punish_group:      step3.punishGroup,
          punish_verbal:     step3.punishGroup === 'verbal',
          punish_written1:   step3.punish2,
          punish_written2:   step3.punish3,
          punish_written3:   step3.punish4,
          punish_other:      step3.punish5,
          punish_other_text: step3.punish5Text,
          witness1_name:     step3.witness1Name,
          witness1_detail:   step3.witness1Detail,
          witness2_name:     step3.witness2Name,
          witness2_detail:   step3.witness2Detail,
          // note: usually we don't update created_at, maybe add updated_at
        })
        .eq('id', id)

      if (updateErr) throw updateErr
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function saveCase({ emp, step1, step2, step3, created_by, created_at }) {
    loading.value = true
    error.value   = null

    try {
      // ── คำนวณ doc_type จาก punishGroup ──
      const docType = step3.punishGroup === 'verbal'
        ? 'ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ'
        : 'ໜັງສືຕັກເຕືອນດ້ວຍວິໄນ'

      const { error: insertErr } = await supabase
        .from('verbal_warning_cases')
        .insert({
          // ── ข้อมูลพนักงาน ──
          employee_code:     emp.code         || null,
          employee_name:     emp.name         || null,
          position:          emp.dept         || null,
          incident_date:     emp.startDate    || null,
          incident_location: emp.location     || null,
          witness_code:      emp.witnessCode  || null,
          witness_name:      emp.witness      || null,
          damage_value:      emp.damageValue  || null,
          subject:           emp.damage       || null,
          detail:            JSON.stringify({
            text: emp.damageDetail || '',
            reg_type: step2.regulationTypeName || '',
            reg_list: step2.regulationList || []
          }) || '',

          // ── step 1 ──
          damage_personal:   step1.damagePersonal || false,
          damage_asset:      step1.damageAsset    || false,
          damage_other:      step1.damageOther    || false,

          // ── step 2 ──
          has_violation:        step2.hasViolation    || false,
          history_type:         step2.historyType     || 'never',
          hr_name:              step2.hrName          || null,
          hr_image:             step2.hrImg           || null,
          hr_responsibility:    step2.hrResponsibility || null,

          // ── step 3: punish group & type ──
          doc_type:          docType,                           // ชื่อเอกสาร
          punish_group:      step3.punishGroup || 'verbal',     // 'verbal' | 'written'
          punish_verbal:     step3.punishGroup === 'verbal',    // true ถ้าเลือก verbal
          punish_written1:   step3.punish2    || false,
          punish_written2:   step3.punish3    || false,
          punish_written3:   step3.punish4    || false,
          punish_other:      step3.punish5    || false,
          punish_other_text: step3.punish5Text || null,

          // ── ลายเซ็น ──
          witness1_name:     step3.witness1Name   || null,
          witness1_detail:   step3.witness1Detail || null,
          witness2_name:     step3.witness2Name   || null,
          witness2_detail:   step3.witness2Detail || null,

          // ── meta ──
          created_by: created_by || null,
          created_at: created_at || null,
        })

      if (insertErr) throw insertErr
      return { success: true }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  return { loading, error, editingCase, saveCase, updateCase }
})
