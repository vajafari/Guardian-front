import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonsPage } from './pages/PersonsPage';
import { BuildingsPage } from './pages/BuildingsPage';
import { BuildingDetailPage } from './pages/BuildingDetailPage';
import { FloorDetailPage } from './pages/FloorDetailPage';
import { BuildingSpacesPage } from './pages/BuildingSpacesPage';
import { ContractsPage } from './pages/ContractsPage';
import { DevicesPage } from './pages/DevicesPage';
import { CamerasPage } from './pages/CamerasPage';
import { FieldOfStudiesPage } from './pages/FieldOfStudiesPage';
import { PositionsPage } from './pages/PositionsPage';
import { CabinetRoomsPage } from './pages/CabinetRoomsPage';
import { CabinetRoomDetailPage } from './pages/CabinetRoomDetailPage';
import { FinSetupPage } from './pages/FinSetupPage';
import { ChargeIssuesPage } from './pages/ChargeIssuesPage';
import { ChargeIssueDetailPage } from './pages/ChargeIssueDetailPage';
import { ChargePlansPage } from './pages/ChargePlansPage';
import { ChargePlanDetailPage } from './pages/ChargePlanDetailPage';
import { ServiceBillingTypesPage } from './pages/ServiceBillingTypesPage';
import { ServiceBillingsPage } from './pages/ServiceBillingsPage';
import { ServiceBillingDetailPage } from './pages/ServiceBillingDetailPage';
import { LateFeeRunsPage } from './pages/LateFeeRunsPage';
import { LateFeeRunDetailPage } from './pages/LateFeeRunDetailPage';
import { CashAccountsPage } from './pages/CashAccountsPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage';
import { ChequesPage } from './pages/ChequesPage';
import { ChequeFatesPage } from './pages/ChequeFatesPage';
import { ChequeFateDetailPage } from './pages/ChequeFateDetailPage';
import { PartyPaymentsPage } from './pages/PartyPaymentsPage';
import { PartyPaymentDetailPage } from './pages/PartyPaymentDetailPage';
import { ExpenseInvoicesPage } from './pages/ExpenseInvoicesPage';
import { ExpenseInvoiceDetailPage } from './pages/ExpenseInvoiceDetailPage';
import { CashTransfersPage } from './pages/CashTransfersPage';
import { CashTransferDetailPage } from './pages/CashTransferDetailPage';
import { FundTransfersPage } from './pages/FundTransfersPage';
import { FundTransferDetailPage } from './pages/FundTransferDetailPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';
import { ElevatorsPage } from './pages/ElevatorsPage';
import { ElevatorDetailPage } from './pages/ElevatorDetailPage';
import { PersonGroupsPage } from './pages/PersonGroupsPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { EditPersonPage } from './pages/EditPersonPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { ContractorDetailPage } from './pages/ContractorDetailPage';
import { LocationsPage } from './pages/LocationsPage';
import { UserGroupsPage } from './pages/UserGroupsPage';
import { UsersPage } from './pages/UsersPage';
import { DashboardLayout } from './components/DashboardLayout';
import { useSyncDocumentDirection } from './hooks/useSyncDocumentDirection';
import { ConfigProvider } from './components/ui';
import { useTheme } from './context/ThemeContext';

function App() {
  useSyncDocumentDirection();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const language = i18n.resolvedLanguage ?? 'en';

  return (
    <ConfigProvider
      value={{
        mode: theme,
        locale: language,
        controlSize: 'md',
        direction: i18n.dir(language),
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/persons" element={<PersonsPage />} />
              <Route path="/buildings" element={<BuildingsPage />} />
              <Route path="/buildings/:id" element={<BuildingDetailPage />} />
              <Route path="/floors/:id" element={<FloorDetailPage />} />
              <Route path="/building-spaces" element={<BuildingSpacesPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/devices/:id" element={<DeviceDetailPage />} />
              <Route path="/cameras" element={<CamerasPage />} />
              <Route path="/field-of-studies" element={<FieldOfStudiesPage />} />
              <Route path="/positions" element={<PositionsPage />} />
              <Route path="/cabinet-rooms" element={<CabinetRoomsPage />} />
              <Route path="/cabinet-rooms/:id" element={<CabinetRoomDetailPage />} />
              <Route path="/fin-setup" element={<FinSetupPage />} />
              <Route path="/fin/charge-issues" element={<ChargeIssuesPage />} />
              <Route path="/fin/charge-issues/:id" element={<ChargeIssueDetailPage />} />
              <Route path="/fin/charge-plans" element={<ChargePlansPage />} />
              <Route path="/fin/charge-plans/:id" element={<ChargePlanDetailPage />} />
              <Route path="/fin/service-billing-types" element={<ServiceBillingTypesPage />} />
              <Route path="/fin/service-billings" element={<ServiceBillingsPage />} />
              <Route path="/fin/service-billings/:id" element={<ServiceBillingDetailPage />} />
              <Route path="/fin/late-fee-runs" element={<LateFeeRunsPage />} />
              <Route path="/fin/late-fee-runs/:id" element={<LateFeeRunDetailPage />} />
              <Route path="/fin/cash-accounts" element={<CashAccountsPage />} />
              <Route path="/fin/receipts" element={<ReceiptsPage />} />
              <Route path="/fin/receipts/:id" element={<ReceiptDetailPage />} />
              <Route path="/fin/cheques" element={<ChequesPage />} />
              <Route path="/fin/cheque-fates" element={<ChequeFatesPage />} />
              <Route path="/fin/cheque-fates/:id" element={<ChequeFateDetailPage />} />
              <Route path="/fin/party-payments" element={<PartyPaymentsPage />} />
              <Route path="/fin/party-payments/:id" element={<PartyPaymentDetailPage />} />
              <Route path="/fin/expense-invoices" element={<ExpenseInvoicesPage />} />
              <Route path="/fin/expense-invoices/:id" element={<ExpenseInvoiceDetailPage />} />
              <Route path="/fin/cash-transfers" element={<CashTransfersPage />} />
              <Route path="/fin/cash-transfers/:id" element={<CashTransferDetailPage />} />
              <Route path="/fin/fund-transfers" element={<FundTransfersPage />} />
              <Route path="/fin/fund-transfers/:id" element={<FundTransferDetailPage />} />
              <Route path="/elevators" element={<ElevatorsPage />} />
              <Route path="/elevators/:id" element={<ElevatorDetailPage />} />
              <Route path="/person-groups" element={<PersonGroupsPage />} />
              <Route path="/persons/:id" element={<PersonDetailPage />} />
              <Route path="/persons/:id/edit" element={<EditPersonPage />} />
              <Route path="/contractors" element={<ContractorsPage />} />
              <Route path="/contractors/:id" element={<ContractorDetailPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/user-groups" element={<UserGroupsPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
