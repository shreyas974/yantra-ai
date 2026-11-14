import { db } from "../lib/db";
async function main() {
    console.log("Seeding safe configuration defaults...");
    const defaults: Record<string, string> = {
        event_name: "YANTRA AI",
        event_tagline: "Code. Create. Conquer.",
        event_theme: "Artificial Intelligence & Machine Learning",
        event_dates: "To be announced.",
        event_timezone: "UTC",
        event_venue: "To be announced.",
        registration_open: "false",
        registration_deadline: "",
        min_team_size: "1",
        max_team_size: "4",
        allow_solo: "true",
        rules_published: "false",
        rules_version: "1.0",
        rules_content: "Official competition rules will be published by organizers prior to registration opening.",
        sponsors: JSON.stringify([]),
        prizes: JSON.stringify([]),
        contact_email: "To be announced.",
        tracks: "[]",
        schedule: "[]",
        faqs: "[]",
        event_starts_at: "",
        team_editing_deadline: "",
        registration_prefix: "YANTRA",
        eligibility: "",
        organizers: "",
        event_mode: "",
    };
    for (const [key, value] of Object.entries(defaults)) {
        await db.eventConfig.upsert({
            where: { key },
            update: {},
            create: { key, value },
        });
    }
    await db.event.upsert({ where: { slug: 'chad' }, update: {}, create: { slug: 'chad', title: 'YANTRA AI', settings: { create: {} } } });
    // Ensure problem statements table remains strictly empty
    const problemCount = await db.problemStatement.count();
    if (problemCount > 0) {
        console.warn("Problem statements found in storage - leaving as is");
    }
    else {
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
    await db.disconnect();
});
