import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import DashboardPage from "@/pages/DashboardPage";
import TeamsPage from "@/pages/TeamsPage";
import JudgesPage from "@/pages/JudgesPage";
import TopicsPage from "@/pages/TopicsPage";
import TopicDetailPage from "@/pages/TopicDetailPage";
import TopicAnalyticsPage from "@/pages/TopicAnalyticsPage";
import TournamentPage from "@/pages/TournamentPage";
import LiveMatchPage from "@/pages/LiveMatchPage";
import LiveMatchListPage from "@/pages/LiveMatchListPage";
import JudgeScoringPage from "@/pages/JudgeScoringPage";
import JudgeScoringListPage from "@/pages/JudgeScoringListPage";
import RankingPage from "@/pages/RankingPage";
import DanmakuSendPage from "@/pages/DanmakuSendPage";
import ArchivePage from "@/pages/ArchivePage";
import ArchivedTournamentDetailPage from "@/pages/ArchivedTournamentDetailPage";
import MatchArchiveDetailPage from "@/pages/MatchArchiveDetailPage";
import PlayersPage from "@/pages/PlayersPage";
import PlayerProfilePage from "@/pages/PlayerProfilePage";
import AIDebatePage from "@/pages/AIDebatePage";
import RulesHandbookPage from "@/pages/RulesHandbookPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/danmaku/:matchId" element={<DanmakuSendPage />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/rules" element={<RulesHandbookPage />} />
                <Route path="/ai-debate" element={<AIDebatePage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/judges" element={<JudgesPage />} />
                <Route path="/topics/analytics" element={<TopicAnalyticsPage />} />
                <Route path="/topics/:topicId" element={<TopicDetailPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="/tournament" element={<TournamentPage />} />
                <Route path="/live" element={<LiveMatchListPage />} />
                <Route path="/live/:matchId" element={<LiveMatchPage />} />
                <Route path="/judge" element={<JudgeScoringListPage />} />
                <Route path="/judge/:matchId" element={<JudgeScoringPage />} />
                <Route path="/ranking" element={<RankingPage />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/player/:playerId" element={<PlayerProfilePage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/archive/:id" element={<ArchivedTournamentDetailPage />} />
                <Route path="/archive/:tournamentId/match/:matchId" element={<MatchArchiveDetailPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
