import { Navigate, Route, Routes } from "react-router-dom";
import { ArchitecturePage } from "@/pages/Architecture/ArchitecturePage";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
import { FileDetailPage } from "@/pages/Files/FileDetailPage";
import { FilesPage } from "@/pages/Files/FilesPage";
import { EvidenceDetailPage } from "@/pages/Evidence/EvidenceDetailPage";
import { EvidencePage } from "@/pages/Evidence/EvidencePage";
import { RequirementDetailPage } from "@/pages/Requirements/RequirementDetailPage";
import { RequirementExtractionPage } from "@/pages/Requirements/RequirementExtractionPage";
import { RequirementsPage } from "@/pages/Requirements/RequirementsPage";
import { VendorComparePage } from "@/pages/Vendors/VendorComparePage";
import { VendorDetailPage } from "@/pages/Vendors/VendorDetailPage";
import { VendorsPage } from "@/pages/Vendors/VendorsPage";
import { ContractPage } from "@/pages/Control/ContractPage";
import { DiscussionPage } from "@/pages/Control/DiscussionPage";
import { IntelligencePage } from "@/pages/Control/IntelligencePage";
import { ScoringPage } from "@/pages/Control/ScoringPage";
import { SubmissionPage } from "@/pages/Control/SubmissionPage";
import { DraftingPage } from "@/pages/Drafting/DraftingPage";
import { DraftSectionPage } from "@/pages/Drafting/DraftSectionPage";
import { ReadinessPage } from "@/pages/Review/ReadinessPage";
import { ReviewDashboardPage } from "@/pages/Review/ReviewDashboardPage";
import { ReviewIssueDetailPage } from "@/pages/Review/ReviewIssueDetailPage";
import { ReviewIssuesPage } from "@/pages/Review/ReviewIssuesPage";
import { ClientReviewPage } from "@/pages/Output/ClientReviewPage";
import { FinalBundlePage } from "@/pages/Output/FinalBundlePage";
import { OutputCenterPage } from "@/pages/Output/OutputCenterPage";
import { RedactionPage } from "@/pages/Output/RedactionPage";
import { SubmissionPackagePage } from "@/pages/Output/SubmissionPackagePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/files" element={<FilesPage />} />
      <Route path="/files/:fileId" element={<FileDetailPage />} />
      <Route
        path="/requirements/extract"
        element={<RequirementExtractionPage />}
      />
      <Route
        path="/requirements/:requirementId"
        element={<RequirementDetailPage />}
      />
      <Route path="/requirements" element={<RequirementsPage />} />
      <Route path="/evidence/:evidenceId" element={<EvidenceDetailPage />} />
      <Route path="/evidence" element={<EvidencePage />} />
      <Route path="/vendors/compare" element={<VendorComparePage />} />
      <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
      <Route path="/vendors" element={<VendorsPage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />
      <Route path="/control/submission" element={<SubmissionPage />} />
      <Route path="/control/scoring" element={<ScoringPage />} />
      <Route path="/control/discussion" element={<DiscussionPage />} />
      <Route path="/control/contract" element={<ContractPage />} />
      <Route path="/control/intelligence" element={<IntelligencePage />} />
      <Route
        path="/control"
        element={<Navigate to="/control/submission" replace />}
      />
      <Route path="/drafts" element={<DraftingPage />} />
      <Route path="/drafts/:sectionId" element={<DraftSectionPage />} />
      <Route path="/review" element={<ReviewDashboardPage />} />
      <Route path="/review/issues" element={<ReviewIssuesPage />} />
      <Route path="/review/issues/:issueId" element={<ReviewIssueDetailPage />} />
      <Route path="/review/readiness" element={<ReadinessPage />} />
      <Route path="/output" element={<OutputCenterPage />} />
      <Route path="/output/submission" element={<SubmissionPackagePage />} />
      <Route path="/output/client-review" element={<ClientReviewPage />} />
      <Route path="/output/redaction" element={<RedactionPage />} />
      <Route path="/output/final-bundle" element={<FinalBundlePage />} />
    </Routes>
  );
}
