import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Tag, Trash2, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PhotoWithTags, TreeMember } from "@/types/database";

interface PhotoGalleryProps {
  photos: PhotoWithTags[];
  members: TreeMember[];
  onDeletePhoto?: (photoId: string) => void;
  onAddTag?: (photoId: string, personId: string) => void;
  onRemoveTag?: (tagId: string) => void;
  isDeleting?: boolean;
  canEdit?: boolean;
}

export function PhotoGallery({
  photos,
  members,
  onDeletePhoto,
  onAddTag,
  onRemoveTag,
  isDeleting,
  canEdit = true,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showTagPopover, setShowTagPopover] = useState(false);

  const getMemberName = (personId: string) => {
    const member = members.find((m) => m.id === personId);
    return member ? `${member.first_name}${member.last_name ? ` ${member.last_name}` : ""}` : "Unknown";
  };

  const getUntaggedMembers = (photo: PhotoWithTags) => {
    const taggedIds = photo.photo_tags.map((t) => t.person_id);
    return members.filter((m) => !taggedIds.includes(m.id));
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No photos yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload photos to start building your family gallery.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.caption || "Family photo"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            {photo.photo_tags.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                {photo.photo_tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs bg-background/80 backdrop-blur-sm"
                  >
                    {getMemberName(tag.person_id).split(" ")[0]}
                  </Badge>
                ))}
                {photo.photo_tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                    +{photo.photo_tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.caption || "Photo Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <img
                src={selectedPhoto?.url}
                alt={selectedPhoto?.caption || "Family photo"}
                className="w-full rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tagged People
                </h4>
                {selectedPhoto?.photo_tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one tagged yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPhoto?.photo_tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{getMemberName(tag.person_id)}</span>
                        </div>
                        {canEdit && onRemoveTag && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRemoveTag(tag.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canEdit && onAddTag && selectedPhoto && getUntaggedMembers(selectedPhoto).length > 0 && (
                  <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Tag className="w-4 h-4 mr-2" />
                        Tag Someone
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0">
                      <ScrollArea className="h-64">
                        <div className="p-2 space-y-1">
                          {getUntaggedMembers(selectedPhoto).map((member) => (
                            <Button
                              key={member.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => {
                                onAddTag(selectedPhoto.id, member.id);
                                setShowTagPopover(false);
                              }}
                            >
                              <User className="w-4 h-4 mr-2" />
                              {member.first_name} {member.last_name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {canEdit && onDeletePhoto && selectedPhoto && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onDeletePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Photo
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
