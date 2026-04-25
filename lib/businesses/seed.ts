import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { requireDb } from "@/lib/firebase/admin";
import {
  MOCK_AMENITIES,
  MOCK_CATEGORIES,
  MOCK_CERT_BODIES,
} from "@/lib/admin/mock/business-taxonomies";
import { MOCK_BUSINESSES } from "@/lib/admin/mock/businesses";
import { slugify, withCollisionSuffix, buildSearchTokens } from "@/lib/businesses/slug";

interface SeedResult {
  categories: number;
  amenities: number;
  certBodies: number;
  businesses: number;
}

export async function seedBusinessesDirectory(): Promise<SeedResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seedBusinessesDirectory must not run in production");
  }
  const db = requireDb();
  const result: SeedResult = { categories: 0, amenities: 0, certBodies: 0, businesses: 0 };

  for (const cat of MOCK_CATEGORIES) {
    await db.collection("categories").doc(cat.id).set(
      {
        slug: cat.slug,
        name: cat.name,
        iconKey: cat.iconKey,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    result.categories += 1;
  }

  for (const am of MOCK_AMENITIES) {
    await db.collection("amenityTaxonomy").doc(am.id).set(
      {
        slug: am.slug,
        name: am.name,
        iconKey: am.iconKey,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    result.amenities += 1;
  }

  for (const cb of MOCK_CERT_BODIES) {
    await db.collection("certificationBodies").doc(cb.id).set(
      {
        slug: cb.slug,
        name: cb.name,
        country: cb.country,
        website: cb.website ?? null,
        logoStoragePath: cb.logoStoragePath ?? null,
        verifiedByPlatform: cb.verifiedByPlatform,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    result.certBodies += 1;
  }

  for (const biz of MOCK_BUSINESSES) {
    const baseSlug = biz.slug || slugify(biz.name, biz.address.city);
    let attempt = 1;
    let finalSlug = baseSlug;
    for (; attempt <= 25; attempt += 1) {
      const candidate = withCollisionSuffix(baseSlug, attempt);
      const reserved = await db.runTransaction(async (tx) => {
        const slugRef = db.collection("slugs").doc(candidate);
        const snap = await tx.get(slugRef);
        if (snap.exists && snap.data()?.businessId !== biz.id) return false;
        tx.set(slugRef, { businessId: biz.id, createdAt: FieldValue.serverTimestamp() }, { merge: true });
        finalSlug = candidate;
        return true;
      });
      if (reserved) break;
    }

    const halalPayload: Record<string, unknown> = {
      status: biz.halal.status,
      certificationBodyId: biz.halal.certificationBodyId ?? null,
      certificationNumber: biz.halal.certificationNumber ?? null,
      expiresAt: biz.halal.expiresAt ? new Date(biz.halal.expiresAt) : null,
    };

    await db.collection("businesses").doc(biz.id).set(
      {
        slug: finalSlug,
        status: biz.status,
        source: biz.source,
        name: biz.name,
        description: biz.description,
        categoryIds: biz.categoryIds,
        halal: halalPayload,
        muslimOwned: biz.muslimOwned,
        platformVerifiedAt: biz.platformVerifiedAt ? new Date(biz.platformVerifiedAt) : null,
        contact: biz.contact,
        address: biz.address,
        hours: biz.hours,
        amenityIds: biz.amenityIds,
        priceTier: biz.priceTier ?? null,
        photos: biz.photos,
        ownerEmail: biz.ownerEmail ?? null,
        searchTokens: buildSearchTokens(biz.name, biz.address.city),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        publishedAt: biz.status === "published" ? FieldValue.serverTimestamp() : null,
      },
      { merge: true },
    );
    result.businesses += 1;
  }

  return result;
}
