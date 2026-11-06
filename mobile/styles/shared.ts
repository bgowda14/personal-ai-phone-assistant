import { StyleSheet } from 'react-native';

import { colors, fonts } from '../lib/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },
  section: {
    width: '100%',
  },
  error: {
    width: '100%',
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.danger,
    marginVertical: 8,
  },
  loading: {
    marginTop: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  linkText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.accent,
  },
  textMuted: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Home: mode backdrop and hero card
  heroShadow: {
    width: '100%',
    borderRadius: 36,
    borderCurve: 'continuous',
    boxShadow: '0 18px 40px rgba(40,30,20,0.20)',
  },
  hero: {
    minHeight: 250,
    justifyContent: 'space-between',
    gap: 18,
    borderRadius: 36,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroLiveText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#fff',
  },
  heroLabel: {
    fontSize: 17,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.85)',
  },
  heroMode: {
    fontSize: 50,
    fontFamily: fonts.medium,
    color: '#fff',
    letterSpacing: -1,
  },
  heroTagline: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroRule: {
    padding: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 6,
  },
  heroRuleText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
    color: '#fff',
  },
  heroRuleExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroRuleExpiryText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
  },

  // Home: status picker grid
  modeGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeTile: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 22,
    padding: 14,
    borderRadius: 26,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeTileText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  modeTileTextActive: {
    color: '#fff',
  },

  // Home: Tell My Assistant
  assistantCard: {
    gap: 12,
  },
  assistantInput: {
    minHeight: 84,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlignVertical: 'top',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assistantHeaderText: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  confirmSummary: {
    fontSize: 17,
    fontFamily: fonts.regular,
    lineHeight: 23,
    color: colors.text,
  },
  confirmLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmLineText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  buttonPair: {
    flexDirection: 'row',
    gap: 10,
  },

  // Lists of cards
  cardList: {
    width: '100%',
    gap: 12,
  },
  dayHeader: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginLeft: 4,
  },

  // Call card
  callCard: {
    gap: 12,
  },
  callCardDismissed: {
    opacity: 0.55,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callName: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  callSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 1,
  },
  callTime: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    alignSelf: 'flex-start',
  },
  callMessage: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 21,
    color: '#2C2C30',
  },
  callRecommendation: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  callRecommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.medium,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  callFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  callStatus: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  callUrgency: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.danger,
  },

  // Calls: stats and cleanup
  statsCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  statValue: {
    fontSize: 26,
    fontFamily: fonts.semibold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  cleanupRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cleanupText: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },

  // Call details
  detailHeader: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
  },
  detailName: {
    fontSize: 26,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 10,
    textAlign: 'center',
  },
  detailPhone: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  detailPills: {
    justifyContent: 'center',
    marginTop: 8,
  },
  detailActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  actionTileSolid: {
    backgroundColor: colors.ink,
  },
  actionTileGlass: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionTileText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  aiCard: {
    marginTop: 16,
    gap: 10,
  },
  aiTitle: {
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  aiBody: {
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 22,
    color: colors.text,
  },
  detailList: {
    marginTop: 16,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  detailRowLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  detailRowValue: {
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 21,
    color: colors.text,
    marginTop: 2,
  },
  detailRowError: {
    color: colors.danger,
  },
  detailRowSeparator: {
    marginLeft: 42,
  },

  // Contacts: form
  formCard: {
    gap: 12,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.fill,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: -4,
  },
  chipRow: {
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
    borderRadius: 999,
    backgroundColor: colors.fill,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },

  // Contacts: list
  groupedCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactRowEditing: {
    backgroundColor: '#EEEDFD',
  },
  contactSeparator: {
    marginLeft: 70,
  },
  contactMeta: {
    alignItems: 'flex-end',
    gap: 5,
  },
  contactPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contactPriorityText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    textTransform: 'capitalize',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Settings
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  profileSubtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsGroupTitle: {
    width: '100%',
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 26,
    marginBottom: 8,
    marginLeft: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  settingsValue: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  settingsSeparator: {
    marginLeft: 56,
  },
  healthValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  footer: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    marginTop: 28,
  },

  // Rules
  ruleBanner: {
    width: '100%',
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  ruleBannerLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noteCard: {
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rulesType: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textTransform: 'capitalize',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  rulesEditRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  rulesSeparator: {
    marginLeft: 16,
  },
});
