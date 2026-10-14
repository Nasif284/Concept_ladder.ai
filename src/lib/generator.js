import { generateLadderContent } from "./ai";

export const generateTopicContent = async (topicName) => {
  const id = crypto.randomUUID();
  const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Attempt AI generation (with auto-retry in ai.js)
  const aiContent = await generateLadderContent(topicName);

  const baseTopic = {
    id,
    slug,
    title: topicName,
    lastAccessed: new Date().toISOString(),
    progress: "kid",
    isFavorite: false,
    isFallback: !aiContent,
    levels: {
      kid: {
        id: "kid",
        title: "Kid Level",
        subtitle: "A fun, simple explanation.",
        description: `Imagine ${topicName} is like a giant playground. In this level, we explore the core ideas using fun analogies!`,
        content: `We encountered a temporary network delay or AI rate limit while generating the full content for **${topicName}**. Please try regenerating or refreshing in a few moments.`,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQqMexNDdIQNzOI9t1xSwDNFU6MxoAh65vi0eqaN1Z9jvUHbRmMRNlFn1MAmjGz8kqOlp7H3WOqDS5b5xXn8Kwp4YsBLR-B4soMxvpT_r8369MZPp8gLMblkdNzDdaAxFEwD4W4U_SMtb1iTvjKV8VWD7lSpGECGWdrtPRA56aGnih6IULcsGVVDwOeaBammCMVM1CUaQBgDvijJDp0VOdcjj_z8FUNtEGaZ1c5cvfZ1tUrTNiYLsjbRKoyQUum7MdV05x_Aev1mLr",
        unlocked: true,
        completed: false,
      },
      beginner: {
        id: "beginner",
        title: "Beginner Level",
        subtitle: "A basic, structured explanation.",
        description: `Now that you have the basic idea, let's explore ${topicName} with more structured detail.`,
        content: `We encountered a temporary network delay or AI rate limit while generating the full content for **${topicName}**. Please try regenerating or refreshing in a few moments.`,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAh7xpL2cEUUeCaHKKfDbn8-OwC69qTUnppPrzKYGAiq5PO_PFm5wCNXypkKD36Dv51To2eWD37Tn3Abq6rSIYzhAjfNtuPEGJAcWXyqJ8YISNoPMLK0W-Yt67SXWNn6mYDhQw285_mw7iH3TcWXQWKjWpQZQ2WZvsEHxXWg1mEyb09ruJY6eXe8u_GP2RoK3Jw3CNEwByrpyyIWidXiI3iPIHnP3dTUau0pe8J6ODbqD_8x_1ens-vssZtXzuVEzfkn500CvwuxJK_",
        unlocked: false,
        completed: false,
      },
      advanced: {
        id: "advanced",
        title: "Advanced Level",
        subtitle: "A deep, expert-level explanation.",
        description: `Ready for the real deal? This level explores the complex nuances, mathematical models, and cutting-edge applications of ${topicName}.`,
        content: `We encountered a temporary network delay or AI rate limit while generating the full content for **${topicName}**. Please try regenerating or refreshing in a few moments.`,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgqKFk1_wsTS4ceftKegKpnci8cv7x0naVHbGQaW6yCaVdvKVudAibrorQHUNMeUp2qTTse7DhdjEdNUHan9g430c9ubPq_mfHivZZuv_4qm-Kpdc8QQ_VRPpk6rXaHxGtCUtRhHAigIQITGR52nibSIVKxOMAM040t9WdwK5HETbRGHUaiKIP52_AoPNd5kZSCeiZIUZM9HLaCPulp2diio573zvLwdIqvFGFDDoJSvrFwDDXzcTWKYeRnahbQ-R9-P3v08zkuV78",
        unlocked: false,
        completed: false,
      },
    },
  };

  if (aiContent) {
    if (aiContent.kid) Object.assign(baseTopic.levels.kid, aiContent.kid);
    if (aiContent.beginner) Object.assign(baseTopic.levels.beginner, aiContent.beginner);
    if (aiContent.advanced) Object.assign(baseTopic.levels.advanced, aiContent.advanced);
  }

  return baseTopic;
};
