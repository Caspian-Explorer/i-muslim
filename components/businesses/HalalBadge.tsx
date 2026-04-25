import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, Star, Sparkles, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Business, BusinessCertificationBody } from "@/types/business";
import { isCertificationActive } from "@/lib/businesses/seo";

interface Props {
  business: Business;
  certBody?: BusinessCertificationBody | null;
  size?: "sm" | "md";
  className?: string;
}

export function HalalBadge({ business, certBody, size = "md", className }: Props) {
  const t = useTranslations("businesses.halal");
  const halalStatus = business.halal.status;
  const certActive = isCertificationActive(business);
  const certExpired = halalStatus === "certified" && !certActive;

  const main = (() => {
    if (halalStatus === "certified") {
      if (certExpired) {
        return (
          <Badge variant="warning" className={cn("gap-1.5", className)}>
            <ShieldAlert className={size === "sm" ? "size-3" : "size-3.5"} />
            {t("certifiedExpired")}
          </Badge>
        );
      }
      return (
        <Badge variant="success" className={cn("gap-1.5", className)}>
          <ShieldCheck className={size === "sm" ? "size-3" : "size-3.5"} />
          {certBody ? t("by", { body: certBody.name }) : t("certified")}
        </Badge>
      );
    }
    if (halalStatus === "self_declared") {
      return (
        <Badge variant="warning" className={cn("gap-1.5", className)}>
          <Star className={size === "sm" ? "size-3" : "size-3.5"} />
          {t("self_declared")}
        </Badge>
      );
    }
    if (halalStatus === "muslim_owned") {
      return (
        <Badge variant="info" className={cn("gap-1.5", className)}>
          <Sparkles className={size === "sm" ? "size-3" : "size-3.5"} />
          {t("muslim_owned")}
        </Badge>
      );
    }
    return null;
  })();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {main}
      {business.muslimOwned && halalStatus !== "muslim_owned" && (
        <Badge variant="info" className="gap-1.5">
          <Sparkles className={size === "sm" ? "size-3" : "size-3.5"} />
          {t("muslim_owned")}
        </Badge>
      )}
      {business.platformVerifiedAt && (
        <Badge variant="info" className="gap-1.5">
          <BadgeCheck className={size === "sm" ? "size-3" : "size-3.5"} />
          {t("verified_by_platform")}
        </Badge>
      )}
    </div>
  );
}
