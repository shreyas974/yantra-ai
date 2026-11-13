export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-400 font-mono">Last updated: November 2026</p>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          <p>
            When you register for CHAD, we collect your email address, full name, organization or educational institution, technical skills, AI/ML experience, and optional professional profile links.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. How We Use Information</h2>
          <p>
            Participant data is strictly utilized for event administration, team formation, hackathon verification, technical evaluation, and organizer communications. We do not sell or monetize personal participant data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Data Security & Storage</h2>
          <p>
            Passwords are hashed using salted cryptographic algorithms. Authentication sessions are revocable and stored with strict server-side authorization controls.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Account and Data Deletion</h2>
          <p>
            Participants may request account or profile data deletion prior to registration approval by contacting the organizing team or submitting a removal request.
          </p>
        </section>
      </div>
    </div>
  );
}
