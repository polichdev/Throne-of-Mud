export const DIPLOMACY_CONFIG = {
  minOpinion: -100,
  maxOpinion: 100,
  warThresholdOpinion: -60,
  allianceMinOpinion: 50,
  allianceOpinionBonus: 15,
  peaceOpinionBonus: 25,
  rightOfPassageRefusalThreshold: -10,
  rightOfPassageOpinionBonus: 10,
  rightOfPassageRefusalOpinionBonus: 5,
  warDeclarationOpinion: -100,
  claimRegionOpinionPenalty: 40,
  defaultClaimCost: 1000,
} as const;
