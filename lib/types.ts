export type Comment = {
  id: string;
  postId: string;
  author: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  author: string;
  title: string;
  body: string;
  images: string[];
  likes: number;
  liked?: boolean;
  createdAt: string;
  aiAnalysis: string;
  /** Legacy fields kept only while reading old local data. */
  textAnalysis?: string;
  imageAnalysis?: string;
  comments: Comment[];
};

export type CreatePostInput = {
  author: string;
  title: string;
  body: string;
  images: File[];
};
