export interface PollOption {
  id: string;
  text: string;
  color: string;
  count: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  creatorId: string;
  creatorName: string;
  question: string;
  description?: string;
  category: string;
  options: PollOption[];
  isClosed: boolean;
  allowMultiple: boolean;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreatorStats {
  totalPolls: number;
  activePolls: number;
  closedPolls: number;
  totalVotes: number;
  avgVotesPerPoll: number;
  mostActivePoll: {
    id: string;
    question: string;
    votes: number;
  } | null;
}

export interface WsVoteCastMessage {
  type: 'vote_cast' | 'snapshot';
  pollId: string;
  totalVotes: number;
  options: PollOption[];
  isClosed?: boolean;
  timestamp?: string;
}
