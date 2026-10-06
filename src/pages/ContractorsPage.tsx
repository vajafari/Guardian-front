import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteContractor, mapContractorGridRow, type ContractorGridRow } from '../api/contractorService';
import { CONTRACTOR_ENDPOINTS } from '../api/config';
import type { Contractor } from '../types/contractor';
import { Alert, Button, Card } from '../components/ui';
import { ContractorFormDialog } from '../components/ContractorFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ContractorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [deletingContractor, setDeletingContractor] = useState<Contractor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingContractor(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: ContractorGridRow) => {
    setEditingContractor(mapContractorGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingContractor) return;
    setIsDeleting(true);
    try {
      await deleteContractor(deletingContractor.id);
      setDeletingContractor(null);
      gridRef.current?.reload();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('contractors.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('contractors.addButton')}
        </Button>
      </div>

      <GridView<ContractorGridRow>
        ref={gridRef}
        dataUrl={CONTRACTOR_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('contractors.empty')}
        onRowClick={(row) => navigate(`/contractors/${row.Id}`)}
        columns={[
          {
            propertyName: 'Title',
            header: t('contractors.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'SubjectOfActivity',
            header: t('contractors.fields.subjectOfActivity'),
            sortable: true,
            filterOperator: 'like',
            render: (row) => row.SubjectOfActivity || '—',
          },
          {
            propertyName: 'PhoneNumber',
            header: t('contractors.fields.phoneNumber'),
            filterOperator: 'like',
            render: (row) => row.PhoneNumber || '—',
          },
          {
            propertyName: 'IsActive',
            header: t('contractors.fields.isActive'),
            sortable: true,
            render: (row) => (row.IsActive ? t('persons.detail.yes') : t('persons.detail.no')),
          },
        ]}
        actions={(row) => (
          <>
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlinePencil />}
              onClick={() => openEdit(row)}
            />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingContractor(mapContractorGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('contractors.loadError')}
        </Alert>
      )}

      <ContractorFormDialog
        isOpen={isFormOpen}
        contractor={editingContractor}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingContractor}
        message={t('contractors.deleteConfirm', { title: deletingContractor?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingContractor(null)}
      />
    </Card>
  );
}
