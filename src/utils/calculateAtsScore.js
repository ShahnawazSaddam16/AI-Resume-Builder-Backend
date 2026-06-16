function calculateAtsScore(resumeData) {
  let score = 0;
  const breakdown = {};

  const hasName = !!resumeData.name?.trim();
  const hasEmail = !!resumeData.email?.trim();
  const hasPhone = !!resumeData.phone?.trim();
  const hasLocation = !!resumeData.location?.trim();

  const contactScore =
    [hasName, hasEmail, hasPhone, hasLocation].filter(Boolean).length * 5;

  breakdown.contact = contactScore;
  score += contactScore;

  const summaryScore =
    resumeData.summary?.trim().split(/\s+/).length >= 30
      ? 15
      : resumeData.summary?.trim()
        ? 8
        : 0;

  breakdown.summary = summaryScore;
  score += summaryScore;

  const skillsCount = Array.isArray(resumeData.skills)
    ? resumeData.skills.length
    : 0;

  const skillsScore =
    skillsCount >= 8 ? 15 : skillsCount >= 4 ? 10 : skillsCount > 0 ? 5 : 0;

  breakdown.skills = skillsScore;
  score += skillsScore;

  const expCount = Array.isArray(resumeData.experience)
    ? resumeData.experience.length
    : 0;

  const expScore = expCount >= 3 ? 20 : expCount >= 1 ? 12 : 0;

  breakdown.experience = expScore;
  score += expScore;

  const eduCount = Array.isArray(resumeData.education)
    ? resumeData.education.length
    : 0;

  const eduScore = eduCount >= 1 ? 10 : 0;

  breakdown.education = eduScore;
  score += eduScore;

  const projCount = Array.isArray(resumeData.projects)
    ? resumeData.projects.length
    : 0;

  const projScore = projCount >= 2 ? 10 : projCount >= 1 ? 5 : 0;

  breakdown.projects = projScore;
  score += projScore;

  const keywordsCount = Array.isArray(resumeData.keywords)
    ? resumeData.keywords.length
    : 0;

  const keywordsScore =
    keywordsCount >= 10
      ? 10
      : keywordsCount >= 5
        ? 6
        : keywordsCount > 0
          ? 3
          : 0;

  breakdown.keywords = keywordsScore;
  score += keywordsScore;

  const hasLinkedin = !!resumeData.linkedin?.trim();
  const hasPortfolio = !!resumeData.portfolio?.trim();

  const linksScore = (hasLinkedin ? 5 : 0) + (hasPortfolio ? 5 : 0);

  breakdown.links = linksScore;
  score += linksScore;

  return {
    score: Math.min(score, 100),
    breakdown,
  };
}

module.exports = calculateAtsScore;