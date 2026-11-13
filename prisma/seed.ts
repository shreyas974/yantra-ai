import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding safe configuration defaults...");

  const defaults: Record<string, string> = {
    event_name: "CHAD",
    event_tagline: "Code. Create. Conquer.",
    event_theme: "Artificial Intelligence & Machine Learning",
    event_dates: "To be announced.",
    event_timezone: "Asia/Kolkata",
    event_venue: "To be announced.",
    registration_open: "false",
    registration_deadline: "To be announced.",
    min_team_size: "1",
    max_team_size: "4",
    allow_solo: "true",
    rules_published: "false",
    rules_version: "1.0",
    rules_content: "Official competition rules will be published by organizers prior to registration opening.",
    sponsors: JSON.stringify([]),
    prizes: JSON.stringify([]),
    contact_email: "To be announced.",
    tracks: JSON.stringify([
      { id: "genai", title: "Generative AI & LLMs", description: "Architect autonomous agents, synthetic reasoning engines, and multimodal intelligence." },
      { id: "vision", title: "Computer Vision & Robotics", description: "Perception systems, real-time spatial computing, and embodied intelligence." },
      { id: "health", title: "AI in Healthcare & Life Sciences", description: "Diagnostic assistance, genomic intelligence, and therapeutic discovery models." },
      { id: "climate", title: "AI for Sustainability & Energy", description: "Smart grid optimization, climate impact modeling, and resource conservation." }
    ]),
    schedule: JSON.stringify([
      { phase: "Registration", time: "To be announced.", description: "Participant onboarding and team formation." },
      { phase: "Problem Statements", time: "To be announced.", description: "Release of hackathon challenges and datasets." },
      { phase: "Hackathon Kickoff", time: "To be announced.", description: "Hacking period begins." },
      { phase: "Submissions Close", time: "To be announced.", description: "Project repo and demo submissions due." },
      { phase: "Evaluation & Results", time: "To be announced.", description: "Jury review and awards ceremony." }
    ]),
    faqs: JSON.stringify([
      { q: "Who can participate in CHAD?", a: "CHAD is open to students, researchers, and developers passionate about Artificial Intelligence and Machine Learning." },
      { q: "What is the team size?", a: "Teams can consist of 1 to 4 members. Solo participation is permitted." },
      { q: "When will problem statements be revealed?", a: "Problem statements will be announced soon. Stay tuned!" },
      { q: "Are there registration fees?", a: "To be announced." }
    ])
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.eventConfig.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // Ensure problem statements table remains strictly empty
  const problemCount = await prisma.problemStatement.count();
  if (problemCount > 0) {
    console.warn("Problem statements found in storage - leaving as is");
  } else {
    console.log("Verified: Problem statement storage is empty.");
  }

  console.log("Safe configuration seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
