import { ReactNode } from "react";

interface MenuCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string; // เพิ่มให้รับ className ได้
}

const MenuCard = ({ icon, title, description, onClick, variant = "secondary", className = "" }: MenuCardProps) => {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      // เพิ่ม ${className} เข้าไปเพื่อให้สไตล์จาก Index.tsx ทำงาน
      className={`group w-full p-6 rounded-2xl text-left transition-all duration-300 flex items-start gap-4 ${
        isPrimary 
          ? "bg-orange-500 text-white shadow-lg hover:scale-[1.02]" 
          : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
      } ${className}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
        isPrimary ? "bg-white/20" : "bg-orange-100 text-orange-600"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className={`text-sm ${isPrimary ? "text-orange-50" : "text-gray-500"}`}>{description}</p>
      </div>
    </button>
  );
};

export default MenuCard;
