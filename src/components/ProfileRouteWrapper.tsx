import { useParams } from "react-router-dom";
import ProfilePage from "@/pages/ProfilePage";
import PublicProfile from "@/pages/PublicProfile";

interface ProfileRouteWrapperProps {
  currentUserId: string | null;
  onDeleteJob: (id: string) => Promise<void>;
}

const ProfileRouteWrapper = ({ currentUserId, onDeleteJob }: ProfileRouteWrapperProps) => {
  const { id } = useParams<{ id: string }>();

  // ถ้าไม่มี id ให้แสดงหน้าแรก
  if (!id) {
    return <div>ไม่พบโปรไฟล์</div>;
  }

  // ตรวจสอบว่าเป็นเจ้าของโปรไฟล์หรือไม่
  const isOwner = currentUserId === id;

  if (isOwner) {
    return <ProfilePage currentUserId={currentUserId} onDeleteJob={onDeleteJob} />;
  } else {
    return <PublicProfile />;
  }
};

export default ProfileRouteWrapper;
