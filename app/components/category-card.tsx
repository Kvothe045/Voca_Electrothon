import { Card } from "../../components/ui/card"
import type { ReactNode } from "react"

interface CategoryCardProps {
  title: string
  count: string
  icon: ReactNode
  color: string
}

export default function CategoryCard({ title, count, icon, color }: CategoryCardProps) {
  return (
    <Card className="bg-black/40 border-purple-900/30 overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-all duration-300">
      <div className="p-6">
        <div
          className={`bg-gradient-to-br ${color} p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">{count} items</p>
      </div>
    </Card>
  )
}

