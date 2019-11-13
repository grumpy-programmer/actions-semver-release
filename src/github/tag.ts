export interface Tag {
  name: string;
  commit: TagCommit,
}

interface TagCommit {
  sha: string;
}
