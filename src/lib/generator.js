import { generateLadderContent } from "./ai";

export const generateTopicContent = async (topicName) => {
  const id = crypto.randomUUID();
  const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Attempt AI generation (throws if rate limited or failed)
  const aiContent = await generateLadderContent(topicName);

  if (!aiContent || !aiContent.kid || !aiContent.beginner || !aiContent.advanced) {
    throw new Error("AI was unable to generate complete curriculum content. Please try again.");
  }

  return {
    id,
    slug,
    title: topicName,
    lastAccessed: new Date().toISOString(),
    progress: "kid",
    isFavorite: false,
    levels: {
      kid: {
        id: "kid",
        title: "Kid Level",
        subtitle: aiContent.kid.subtitle || "A fun, simple explanation.",
        description:
          aiContent.kid.description ||
          `Imagine ${topicName} is like a giant playground. In this level, we explore the core ideas using fun analogies!`,
        content: aiContent.kid.content,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDQqMexNDdIQNzOI9t1xSwDNFU6MxoAh65vi0eqaN1Z9jvUHbRmMRNlFn1MAmjGz8kqOlp7H3WOqDS5b5xXn8Kwp4YsBLR-B4soMxvpT_r8369MZPp8gLMblkdNzDdaAxFEwD4W4U_SMtb1iTvjKV8VWD7lSpGECGWdrtPRA56aGnih6IULcsGVVDwOeaBammCMVM1CUaQBgDvijJDp0VOdcjj_z8FUNtEGaZ1c5cvfZ1tUrTNiYLsjbRKoyQUum7MdV05x_Aev1mLr",
        unlocked: true,
        completed: false,
      },
      beginner: {
        id: "beginner",
        title: "Beginner Level",
        subtitle: aiContent.beginner.subtitle || "A basic, structured explanation.",
        description:
          aiContent.beginner.description ||
          `Now that you have the basic idea, let's explore ${topicName} with more structured detail.`,
        content: aiContent.beginner.content,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAh7xpL2cEUUeCaHKKfDbn8-OwC69qTUnppPrzKYGAiq5PO_PFm5wCNXypkKD36Dv51To2eWD37Tn3Abq6rSIYzhAjfNtuPEGJAcWXyqJ8YISNoPMLK0W-Yt67SXWNn6mYDhQw285_mw7iH3TcWXQWKjWpQZQ2WZvsEHxXWg1mEyb09ruJY6eXe8u_GP2RoK3Jw3CNEwByrpyyIWidXiI3iPIHnP3dTUau0pe8J6ODbqD_8x_1ens-vssZtXzuVEzfkn500CvwuxJK_",
        unlocked: false,
        completed: false,
      },
      advanced: {
        id: "advanced",
        title: "Advanced Level",
        subtitle: aiContent.advanced.subtitle || "A deep, expert-level explanation.",
        description:
          aiContent.advanced.description ||
          `Complex nuances, mathematical models, and cutting-edge applications of ${topicName}.`,
        content: aiContent.advanced.content,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDgqKFk1_wsTS4ceftKegKpnci8cv7x0naVHbGQaW6yCaVdvKVudAibrorQHUNMeUp2qTTse7DhdjEdNUHan9g430c9ubPq_mfHivZZuv_4qm-Kpdc8QQ_VRPpk6rXaHxGtCUtRhHAigIQITGR52nibSIVKxOMAM040t9WdwK5HETbRGHUaiKIP52_AoPNd5kZSCeiZIUZM9HLaCPulp2diio573zvLwdIqvFGFDDoJSvrFwDDXzcTWKYeRnahbQ-R9-P3v08zkuV78",
        unlocked: false,
        completed: false,
      },
    },
  };
};
