export const metadata = {
  "user": {
    "collection": "user",
    "unique": [
      "id",
      "email",
      "firebaseUid"
    ],
    "defaults": {
      "id": "$id",
      "role": "USER",
      "emailVerified": false,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": ["firebaseUid"],
    "relations": [
      "notifications",
      "sessions",
      "verifications",
      "passwordResets",
      "profile",
      "teamMembership",
      "ledTeams",
      "submissions",
      "auditLogs"
    ]
  },
  "session": {
    "collection": "session",
    "unique": [
      "id",
      "token"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "userAgent",
      "ipAddress"
    ],
    "relations": [
      "user"
    ]
  },
  "verificationToken": {
    "collection": "verificationToken",
    "unique": [
      "id",
      "token"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now"
    },
    "nullable": [
      "usedAt"
    ],
    "relations": [
      "user"
    ]
  },
  "passwordResetToken": {
    "collection": "passwordResetToken",
    "unique": [
      "id",
      "token"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now"
    },
    "nullable": [
      "usedAt"
    ],
    "relations": [
      "user"
    ]
  },
  "profile": {
    "collection": "profile",
    "unique": [
      "id",
      "userId"
    ],
    "defaults": {
      "id": "$id",
      "privacyConsent": false,
      "rulesAccepted": false,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "phone",
      "department",
      "studyYear",
      "githubUrl",
      "linkedinUrl",
      "portfolioUrl",
      "rulesVersion"
    ],
    "relations": [
      "user"
    ]
  },
  "team": {
    "collection": "team",
    "unique": [
      "id",
      "name"
    ],
    "defaults": {
      "id": "$id",
      "isSolo": false,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [],
    "relations": [
      "leader",
      "members",
      "invitations",
      "submission"
    ]
  },
  "teamMember": {
    "collection": "teamMember",
    "unique": [
      "id",
      "userId"
    ],
    "defaults": {
      "id": "$id",
      "role": "MEMBER",
      "joinedAt": "$now"
    },
    "nullable": [],
    "relations": [
      "team",
      "user"
    ]
  },
  "teamInvitation": {
    "collection": "teamInvitation",
    "unique": [
      "id",
      "token"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now"
    },
    "nullable": [
      "usedAt"
    ],
    "relations": [
      "team"
    ]
  },
  "registrationSubmission": {
    "collection": "registrationSubmission",
    "unique": [
      "id",
      "registrationId",
      "teamId"
    ],
    "defaults": {
      "id": "$id",
      "status": "PENDING",
      "submittedAt": "$now"
    },
    "nullable": [
      "rejectionReason",
      "reviewedAt",
      "reviewedById"
    ],
    "relations": [
      "team",
      "submittedBy"
    ]
  },
  "eventConfig": {
    "collection": "eventConfig",
    "unique": [
      "id",
      "key"
    ],
    "defaults": {
      "id": "$id",
      "updatedAt": "$now"
    },
    "nullable": [],
    "relations": []
  },
  "announcement": {
    "collection": "announcement",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "status": "DRAFT",
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "scheduledFor",
      "publishedAt"
    ],
    "relations": []
  },
  "contactMessage": {
    "collection": "contactMessage",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "isRead": false,
      "createdAt": "$now"
    },
    "nullable": [],
    "relations": []
  },
  "problemStatement": {
    "collection": "problemStatement",
    "unique": [
      "id",
      "identifier"
    ],
    "defaults": {
      "id": "$id",
      "status": "DRAFT",
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "identifier",
      "trackId",
      "datasetsUrl",
      "evaluationCriteria"
    ],
    "relations": [
      "trackRelation"
    ]
  },
  "auditLog": {
    "collection": "auditLog",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now"
    },
    "nullable": [
      "userId",
      "entityId",
      "details",
      "ipAddress"
    ],
    "relations": [
      "user"
    ]
  },
  "event": {
    "collection": "event",
    "unique": [
      "id",
      "slug"
    ],
    "defaults": {
      "id": "$id",
      "description": "",
      "timezone": "UTC",
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "startsAt",
      "endsAt",
      "venue",
      "mode"
    ],
    "relations": [
      "settings",
      "tracks",
      "schedule",
      "prizes",
      "faqs",
      "sponsors"
    ]
  },
  "eventSettings": {
    "collection": "eventSettings",
    "unique": [
      "id",
      "eventId"
    ],
    "defaults": {
      "id": "$id",
      "minTeamSize": 1,
      "maxTeamSize": 4,
      "allowSolo": true,
      "updatedAt": "$now"
    },
    "nullable": [
      "registrationDeadline",
      "teamEditingDeadline"
    ],
    "relations": [
      "event"
    ]
  },
  "track": {
    "collection": "track",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "description": "",
      "published": false,
      "position": 0,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [],
    "relations": [
      "event",
      "problems"
    ]
  },
  "scheduleItem": {
    "collection": "scheduleItem",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "description": "",
      "published": false,
      "position": 0,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "startsAt"
    ],
    "relations": [
      "event"
    ]
  },
  "prize": {
    "collection": "prize",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "description": "",
      "published": false,
      "position": 0,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [],
    "relations": [
      "event"
    ]
  },
  "fAQ": {
    "collection": "fAQ",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "published": false,
      "position": 0,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [],
    "relations": [
      "event"
    ]
  },
  "sponsor": {
    "collection": "sponsor",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "description": "",
      "published": false,
      "position": 0,
      "createdAt": "$now",
      "updatedAt": "$now"
    },
    "nullable": [
      "url"
    ],
    "relations": [
      "event"
    ]
  },
  "notification": {
    "collection": "notification",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "createdAt": "$now"
    },
    "nullable": [
      "readAt"
    ],
    "relations": [
      "user"
    ]
  },
  "rateLimitBucket": {
    "collection": "rateLimitBucket",
    "unique": [
      "key"
    ],
    "defaults": {
      "count": 1
    },
    "nullable": [],
    "relations": []
  },
  "firebaseDeletion": {
    "collection": "firebaseDeletion",
    "unique": ["id"],
    "defaults": { "createdAt": "$now" },
    "nullable": [],
    "relations": []
  },
  "emailOutbox": {
    "collection": "emailOutbox",
    "unique": [
      "id"
    ],
    "defaults": {
      "id": "$id",
      "attempts": 0,
      "createdAt": "$now"
    },
    "nullable": [
      "deliveredAt",
      "lastError"
    ],
    "relations": []
  }
} as const;
