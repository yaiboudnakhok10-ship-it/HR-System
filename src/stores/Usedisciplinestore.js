import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useDisciplineStore = defineStore('discipline', () => {
  const loading = ref(false)
  const error = ref(null)

  async function saveCase({
    emp,
    step1,
    step2,
    step3,
    step4,
    step5,
    totalKip,
    amountAfterPercent,
    created_by,
    created_at,
    case_type,
    percent,
    history_type,
    currency_type,  // ✅ รับสกุลเงิน 'baht' | 'dollar'
  }) {
    loading.value = true
    error.value = null

    try {
      // เตรียม punish_types array
      const punishTypes = []
      if (step3.punish1) punishTypes.push('verbal')
      if (step3.punish2) punishTypes.push('written1')
      if (step3.punish3) punishTypes.push('written2')
      if (step3.punish4) punishTypes.push('written3')
      if (step3.punish5) punishTypes.push('other')

      // เตรียม damage_types array
      const damageTypes = []
      if (step1.damagePersonal) damageTypes.push('personal')
      if (step1.damageAsset)    damageTypes.push('asset')
      if (step1.damageOther)    damageTypes.push('other')

      const { data, error: insertErr } = await supabase
        .from('discipline_cases')
        .insert({
          employee_code:     emp.code     || null,
          employee_name:     emp.name     || null,
          position:          emp.dept     || null,
          incident_date:     emp.startDate || null,
          incident_location: emp.location || null,
          witness_code:      emp.witnessCode || null,
          witness_name:      emp.witness  || null,
          damage_value:      emp.damageValue || null,
          subject:           emp.damage   || null,
          detail:            emp.damageDetail || null,
          investigator:      emp.investigator || null,

          damage_types: damageTypes,
          amount_baht:  step1.amountBaht ? Number(step1.amountBaht) : null,

          // ✅ สกุลเงิน: 'baht' หรือ 'dollar'
          currency_type:
            currency_type ||
            step1.currencyType ||
            'baht',

          // เปอร์เซ็นต์
          percent:
            percent !== undefined && percent !== null && percent !== ''
              ? Number(percent)
              : (step1.percent !== undefined && step1.percent !== null && step1.percent !== ''
                  ? Number(step1.percent)
                  : null),

          // จำนวนเงินหลังหักเปอร์เซ็นต์
          amount_after_percent: amountAfterPercent != null
            ? Number(amountAfterPercent)
            : null,

          rate_kip:     step1.rateKip     ? Number(step1.rateKip)     : null,
          total_kip:    totalKip          || null,
          installments: step1.installments ? Number(step1.installments) : null,
          pay_date:     step1.payDate     || null,

          has_violation: step2.hasViolation || false,
          history_type:  history_type || step2.historyType || 'never',
          hr_name:       step2.hrName || null,
          hr_image:      step2.hrImg  || null,
          hr_responsibility: step2.hrResponsibility || null,

          regulation_type_id:   step2.regulationTypeId   || null,
          regulation_type_name: step2.regulationTypeName || null,
          regulation_list:      step2.regulationList     || [],

          punish_types:      punishTypes,
          punish_other_text: step3.punish5Text || null,
          witness1_name:     step3.witness1Name   || null,
          witness1_detail:   step3.witness1Detail || null,
          witness2_name:     step3.witness2Name   || null,
          witness2_detail:   step3.witness2Detail || null,

          commission_chairman:      step4?.chairman     || null,
          commission_vice_chairman: step4?.viceChairman || null,
          commission_committee1:    step4?.committee1   || null,
          commission_committee2:    step4?.committee2   || null,
          commission_committee3:    step4?.committee3   || null,
          commission_secretary:     step4?.secretary    || null,

          address:       step5?.address      || null,
          id_card:       step5?.idCard       || null,
          total_damage:  step5?.totalDamage  ? Number(step5.totalDamage)  : null,
          deduct_amount: step5?.deductAmount ? Number(step5.deductAmount) : null,
          hr_approver:      step5?.hrApprover   || null,
          hr_approver_name: step5?.investigator || null,

          created_by: created_by || null,
          created_at: created_at || null,
          case_type:  case_type  || null,
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      return { success: true, data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function updateCase(id, {
    emp,
    step1,
    step2,
    step3,
    step4,
    step5,
    totalKip,
    amountAfterPercent,
    case_type,
    percent,
    history_type,
    currency_type,
  }) {
    loading.value = true
    error.value = null

    try {
      const punishTypes = []
      if (step3.punish1) punishTypes.push('verbal')
      if (step3.punish2) punishTypes.push('written1')
      if (step3.punish3) punishTypes.push('written2')
      if (step3.punish4) punishTypes.push('written3')
      if (step3.punish5) punishTypes.push('other')

      const damageTypes = []
      if (step1.damagePersonal) damageTypes.push('personal')
      if (step1.damageAsset)    damageTypes.push('asset')
      if (step1.damageOther)    damageTypes.push('other')

      const { data, error: updateErr } = await supabase
        .from('discipline_cases')
        .update({
          employee_code:     emp.code     || null,
          employee_name:     emp.name     || null,
          position:          emp.dept     || null,
          incident_date:     emp.startDate || null,
          incident_location: emp.location || null,
          witness_code:      emp.witnessCode || null,
          witness_name:      emp.witness  || null,
          damage_value:      emp.damageValue || null,
          subject:           emp.damage   || null,
          detail:            emp.damageDetail || null,
          investigator:      emp.investigator || null,

          damage_types: damageTypes,
          amount_baht:  step1.amountBaht ? Number(step1.amountBaht) : null,
          currency_type: currency_type || step1.currencyType || 'baht',
          percent: percent !== undefined && percent !== null && percent !== ''
              ? Number(percent)
              : (step1.percent !== undefined && step1.percent !== null && step1.percent !== '' ? Number(step1.percent) : null),
          amount_after_percent: amountAfterPercent != null ? Number(amountAfterPercent) : null,
          rate_kip:     step1.rateKip     ? Number(step1.rateKip)     : null,
          total_kip:    totalKip          || null,
          installments: step1.installments ? Number(step1.installments) : null,
          pay_date:     step1.payDate     || null,

          has_violation: step2.hasViolation || false,
          history_type:  history_type || step2.historyType || 'never',
          hr_name:       step2.hrName || null,
          hr_image:      step2.hrImg  || null,
          hr_responsibility: step2.hrResponsibility || null,
          regulation_type_id:   step2.regulationTypeId   || null,
          regulation_type_name: step2.regulationTypeName || null,
          regulation_list:      step2.regulationList     || [],

          punish_types:      punishTypes,
          punish_other_text: step3.punish5Text || null,
          witness1_name:     step3.witness1Name   || null,
          witness1_detail:   step3.witness1Detail || null,
          witness2_name:     step3.witness2Name   || null,
          witness2_detail:   step3.witness2Detail || null,

          commission_chairman:      step4?.chairman     || null,
          commission_vice_chairman: step4?.viceChairman || null,
          commission_committee1:    step4?.committee1   || null,
          commission_committee2:    step4?.committee2   || null,
          commission_committee3:    step4?.committee3   || null,
          commission_secretary:     step4?.secretary    || null,

          address:       step5?.address      || null,
          id_card:       step5?.idCard       || null,
          total_damage:  step5?.totalDamage  ? Number(step5.totalDamage)  : null,
          deduct_amount: step5?.deductAmount ? Number(step5.deductAmount) : null,
          hr_approver:      step5?.hrApprover   || null,
          hr_approver_name: step5?.investigator || null,

          case_type:  case_type  || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateErr) throw updateErr
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  return { loading, error, saveCase, updateCase }
})