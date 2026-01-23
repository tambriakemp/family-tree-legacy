import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyTree } from "@/hooks/useFamilyTrees";
import { useTreeMembers } from "@/hooks/useTreeMembers";
import { usePhotos } from "@/hooks/usePhotos";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUploader } from "@/components/photos/PhotoUploader";

const GalleryPage = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const { data: tree, isLoading: treeLoading } = useFamilyTree(treeId);
  const { members, isLoading: membersLoading } = useTreeMembers(treeId);
  const { photos, isLoading: photosLoading, uploadPhoto, deletePhoto, addPhotoTag, removePhotoTag } = usePhotos(treeId);

  const [showUploader, setShowUploader] = useState(false);

  const isLoading = treeLoading || membersLoading || photosLoading;

  const handleUpload = async (file: File, caption?: string) => {
    if (!treeId) return;
    await uploadPhoto.mutateAsync({ file, caption, treeId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-heavy border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/trees/${treeId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tree
              </Button>
            </Link>
            <h1 className="font-display text-lg font-semibold">
              {tree?.title} - Photos
            </h1>
          </div>
          <Button onClick={() => setShowUploader(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PhotoGallery
              photos={photos}
              members={members}
              onDeletePhoto={(id) => deletePhoto.mutateAsync(id)}
              onAddTag={(photoId, personId) => addPhotoTag.mutateAsync({ photoId, personId })}
              onRemoveTag={(tagId) => removePhotoTag.mutateAsync(tagId)}
              isDeleting={deletePhoto.isPending}
            />
          </motion.div>
        </div>
      </main>

      {/* Photo Uploader Dialog */}
      <PhotoUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        onUpload={handleUpload}
        isUploading={uploadPhoto.isPending}
      />
    </div>
  );
};

export default GalleryPage;
