import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, Alert, Keyboard, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useExpenses } from '@/lib/expense-context';
import { CATEGORIES, PAYMENT_MEDIUMS, INCOME_CATEGORIES } from '@/lib/categories';
import { CategoryIcon } from '@/components/CategoryIcon';
import { IncomeIcon } from '@/components/IncomeIcon';
import { parseSMS } from '@/lib/sms-parser';
import { ExpenseCategory, PaymentMedium, IncomeCategory } from '@/lib/types';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { formatFullDate } from '@/lib/format';

type EntryMode = 'expense' | 'income';

function DatePickerField({
  date,
  onChange,
}: {
  date: Date;
  onChange: (d: Date) => void;
}) {
  const [show, setShow] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  if (Platform.OS === 'ios') {
    return (
      <View>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShow(v => !v)}
        >
          <Feather name="calendar" size={16} color={Colors.light.tint} />
          <Text style={styles.dateButtonText}>{formatFullDate(date.toISOString())}</Text>
          <Feather name={show ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.light.textMuted} />
        </Pressable>
        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            onChange={handleChange}
            themeVariant="light"
            accentColor={Colors.light.tint}
          />
        )}
      </View>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <View>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShow(true)}
        >
          <Feather name="calendar" size={16} color={Colors.light.tint} />
          <Text style={styles.dateButtonText}>{formatFullDate(date.toISOString())}</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />
        </Pressable>
        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleChange}
          />
        )}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        style={styles.dateButton}
        onPress={() => setShow(v => !v)}
      >
        <Feather name="calendar" size={16} color={Colors.light.tint} />
        <Text style={styles.dateButtonText}>{formatFullDate(date.toISOString())}</Text>
        <Feather name={show ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.light.textMuted} />
      </Pressable>
      {show && (
        <Modal transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(e, d) => { if (d) onChange(d); }}
                themeVariant="light"
              />
              <Pressable style={styles.modalDone} onPress={() => setShow(false)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { addExpense, addIncome } = useExpenses();

  const [mode, setMode] = useState<EntryMode>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('salary');
  const [paymentMedium, setPaymentMedium] = useState<PaymentMedium>('upi');
  const [cardInfo, setCardInfo] = useState('');
  const [source, setSource] = useState('');
  const [smsText, setSmsText] = useState('');
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const amountRef = useRef<TextInput>(null);

  const handleParseSms = () => {
    if (!smsText.trim()) return;
    const parsed = parseSMS(smsText);
    if (parsed.amount) setAmount(parsed.amount.toString());
    if (parsed.merchant) setNote(parsed.merchant);
    if (parsed.date) setSelectedDate(new Date(parsed.date));
    setCategory(parsed.category);
    setPaymentMedium(parsed.paymentMedium);
    if (parsed.cardInfo) setCardInfo(parsed.cardInfo);
    setShowSmsInput(false);
    setSmsText('');
    setMode('expense');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setIsSaving(true);
    try {
      if (mode === 'expense') {
        await addExpense({
          amount: parsedAmount,
          category,
          note: note.trim(),
          paymentMedium,
          cardInfo: cardInfo.trim(),
          date: selectedDate.toISOString(),
        });
      } else {
        await addIncome({
          amount: parsedAmount,
          category: incomeCategory,
          note: note.trim(),
          source: source.trim(),
          date: selectedDate.toISOString(),
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAmount('');
      setNote('');
      setSelectedDate(new Date());
      setCategory('other');
      setIncomeCategory('salary');
      setPaymentMedium('upi');
      setCardInfo('');
      setSource('');
      Keyboard.dismiss();
      Alert.alert('Saved', `${mode === 'expense' ? 'Expense' : 'Income'} added successfully.`);
    } catch {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + topInset + 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 }}
      bottomOffset={40}
    >
      <Text style={styles.title}>Add Entry</Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, mode === 'expense' && styles.toggleActive]}
          onPress={() => { setMode('expense'); Haptics.selectionAsync(); }}
        >
          <Feather name="arrow-up-right" size={16} color={mode === 'expense' ? '#fff' : Colors.light.textSecondary} />
          <Text style={[styles.toggleText, mode === 'expense' && styles.toggleTextActive]}>Expense</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, mode === 'income' && styles.toggleIncomeActive]}
          onPress={() => { setMode('income'); Haptics.selectionAsync(); }}
        >
          <Feather name="arrow-down-left" size={16} color={mode === 'income' ? '#fff' : Colors.light.textSecondary} />
          <Text style={[styles.toggleText, mode === 'income' && styles.toggleTextActive]}>Income</Text>
        </Pressable>
      </View>

      {mode === 'expense' && (
        <Pressable
          style={({ pressed }) => [styles.smsButton, pressed && { opacity: 0.7 }]}
          onPress={() => setShowSmsInput(!showSmsInput)}
        >
          <View style={styles.smsIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.light.tint} />
          </View>
          <View style={styles.smsButtonText}>
            <Text style={styles.smsButtonTitle}>Parse from SMS</Text>
            <Text style={styles.smsButtonSubtitle}>Paste a bank SMS to auto-fill</Text>
          </View>
          <Ionicons name={showSmsInput ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.light.textMuted} />
        </Pressable>
      )}

      {showSmsInput && mode === 'expense' && (
        <View style={styles.smsInputCard}>
          <TextInput
            style={styles.smsInput}
            placeholder="Paste your bank SMS here..."
            placeholderTextColor={Colors.light.textMuted}
            multiline
            value={smsText}
            onChangeText={setSmsText}
            textAlignVertical="top"
          />
          <Pressable
            style={({ pressed }) => [styles.parseButton, pressed && { opacity: 0.8 }, !smsText.trim() && styles.parseButtonDisabled]}
            onPress={handleParseSms}
            disabled={!smsText.trim()}
          >
            <Feather name="zap" size={16} color="#fff" />
            <Text style={styles.parseButtonText}>Parse SMS</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>{'\u20B9'}</Text>
          <TextInput
            ref={amountRef}
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={Colors.light.gray300}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Date</Text>
        <DatePickerField date={selectedDate} onChange={setSelectedDate} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{mode === 'expense' ? 'Note (Merchant)' : 'Note'}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={mode === 'expense' ? 'Where did you spend?' : 'Describe the income'}
          placeholderTextColor={Colors.light.textMuted}
          value={note}
          onChangeText={setNote}
        />
      </View>

      {mode === 'expense' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[styles.chip, isSelected && { backgroundColor: cat.bgColor, borderColor: cat.color }]}
                    onPress={() => { setCategory(cat.key); Haptics.selectionAsync(); }}
                  >
                    <CategoryIcon category={cat} size={24} />
                    <Text style={[styles.chipText, isSelected && { color: cat.color, fontFamily: 'DMSans_600SemiBold' }]}>
                      {cat.label.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.chipGrid}>
              {PAYMENT_MEDIUMS.map(pm => {
                const isSelected = paymentMedium === pm.key;
                return (
                  <Pressable
                    key={pm.key}
                    style={[styles.chip, isSelected && { backgroundColor: Colors.light.tintLight, borderColor: Colors.light.tint }]}
                    onPress={() => { setPaymentMedium(pm.key); Haptics.selectionAsync(); }}
                  >
                    <Ionicons name={pm.icon as any} size={16} color={isSelected ? Colors.light.tint : Colors.light.textSecondary} />
                    <Text style={[styles.chipText, isSelected && { color: Colors.light.tint, fontFamily: 'DMSans_600SemiBold' }]}>
                      {pm.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {(paymentMedium === 'credit_card' || paymentMedium === 'debit_card') && (
            <View style={styles.card}>
              <Text style={styles.label}>Card Details (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. HDFC Card ending 2567"
                placeholderTextColor={Colors.light.textMuted}
                value={cardInfo}
                onChangeText={setCardInfo}
              />
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Income Type</Text>
            <View style={styles.chipGrid}>
              {INCOME_CATEGORIES.map(cat => {
                const isSelected = incomeCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[styles.chip, isSelected && { backgroundColor: cat.bgColor, borderColor: cat.color }]}
                    onPress={() => { setIncomeCategory(cat.key); Haptics.selectionAsync(); }}
                  >
                    <IncomeIcon category={cat} size={24} />
                    <Text style={[styles.chipText, isSelected && { color: cat.color, fontFamily: 'DMSans_600SemiBold' }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Source (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Company Name, Client, Platform"
              placeholderTextColor={Colors.light.textMuted}
              value={source}
              onChangeText={setSource}
            />
          </View>
        </>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          mode === 'income' && styles.saveButtonIncome,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          isSaving && { opacity: 0.6 },
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Feather name="check" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : mode === 'expense' ? 'Save Expense' : 'Save Income'}
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 11,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: Colors.light.danger,
  },
  toggleIncomeActive: {
    backgroundColor: Colors.light.tint,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  smsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  smsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsButtonText: {
    flex: 1,
  },
  smsButtonTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  smsButtonSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  smsInputCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  smsInput: {
    minHeight: 80,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    backgroundColor: Colors.light.gray100,
    borderRadius: 10,
    padding: 12,
  },
  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  parseButtonDisabled: {
    opacity: 0.4,
  },
  parseButtonText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
    paddingVertical: 0,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.gray100,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  modalDone: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  modalDoneText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    backgroundColor: Colors.light.gray100,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
    backgroundColor: Colors.light.gray100,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.danger,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonIncome: {
    backgroundColor: Colors.light.tint,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
});
