import type { ArticleListItem } from "@/types/blog";
import { ArticleCard } from "./ArticleCard";

export function ArticleList({ articles }: { articles: ArticleListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
