import type { AdminUser, AdminRole, AdminUserStatus } from "@/types/admin";

const NAMES = [
  "Aisha Rahman", "Yusuf Khan", "Fatima Ahmed", "Ibrahim Abdullah",
  "Mariam Hassan", "Omar Siddiqui", "Zainab Iqbal", "Khalid Anwar",
  "Layla Nasser", "Bilal Karim", "Safiya Chaudhry", "Hamza Syed",
  "Amina Toure", "Mustafa Yilmaz", "Noor Al-Harbi", "Abdul-Rahman Ali",
  "Hadiya Rashid", "Tariq Patel", "Khadija Nour", "Ismail Suleiman",
  "Rania Farouk", "Saif Ahmad", "Nadia Khoury", "Jibril Musa",
  "Sumaya Ibrahim", "Kareem Osman", "Hafsa Mirza", "Rashid Aziz",
  "Zahra Mahmoud", "Imran Sheikh", "Salma Bouazizi", "Fahim Raza",
  "Rabia Khalil", "Saeed Bashir", "Hana Abdi", "Yasmin Qureshi",
  "Adam Thompson", "Fatih Kaya", "Malak Badr", "Emir Demir",
  "Isra Malik", "Mehmet Ozdemir", "Nur Aisyah Binti", "Ridwan Hakim",
  "Sofia Benali", "Umar Faruq", "Widad Saleh", "Yahya Diop",
  "Zeynep Arslan", "Mohammed Al-Amin",
];

const STATUSES: AdminUserStatus[] = ["active", "active", "active", "active", "pending", "suspended"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildMockUsers(): AdminUser[] {
  const rand = seededRandom(42);
  const now = Date.now();
  return NAMES.map((name, i) => {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
    const joinedDaysAgo = Math.floor(rand() * 720);
    const lastActiveHoursAgo = Math.floor(rand() * 24 * 30);
    const role: AdminRole =
      i === 0 ? "admin" : i < 5 ? "moderator" : i < 12 ? "scholar" : "member";
    const status = STATUSES[Math.floor(rand() * STATUSES.length)]!;
    return {
      id: `u_${i.toString().padStart(3, "0")}`,
      name,
      email: `${slug}@example.com`,
      avatarUrl: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      role,
      status,
      verified: rand() > 0.25,
      joinedAt: new Date(now - joinedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(now - lastActiveHoursAgo * 60 * 60 * 1000).toISOString(),
    };
  });
}

export const MOCK_USERS: AdminUser[] = buildMockUsers();
