import { useState, useEffect } from 'react';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Plus, Edit, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react';
import { userService, AppUser } from '../../../services/userService';

type RoleFilter = 'all' | 'student' | 'faculty' | 'admin';

export function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = userService.subscribe((items) => {
      setUsers(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = users.filter((u) => {
    const roleOk = selectedRole === 'all' || u.role === selectedRole;
    const q = searchQuery.toLowerCase();
    const searchOk = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.studentId?.toLowerCase().includes(q);
    return roleOk && searchOk;
  });

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === 'student').length,
    faculty: users.filter((u) => u.role === 'faculty').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  const roleTabs: { id: RoleFilter; name: string }[] = [
    { id: 'all', name: 'All Users' },
    { id: 'student', name: 'Students' },
    { id: 'faculty', name: 'Faculty' },
    { id: 'admin', name: 'Admins' },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeletingId(id);
    try { await userService.delete(id); }
    finally { setDeletingId(null); }
  };

  const handleToggleStatus = async (user: AppUser) => {
    setTogglingId(user.id);
    try { await userService.update(user.id, { isActive: !user.isActive }); }
    finally { setTogglingId(null); }
  };

  const roleVariant = (role: string) =>
    role === 'admin' ? 'danger' : role === 'faculty' ? 'primary' : 'secondary';

  const idOf = (u: AppUser) => u.studentId || '—';

  const createdAt = (u: AppUser) => {
    if (!u.createdAt) return '—';
    try { return u.createdAt.toDate().toLocaleDateString(); } catch { return '—'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">User Management</h1>
          <p className="text-[--muted-foreground]">Manage students, faculty, and administrators</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />Add User
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {roleTabs.map((tab) => (
          <button key={tab.id} onClick={() => setSelectedRole(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedRole === tab.id
                ? 'bg-[--primary-blue] text-white'
                : 'bg-white text-[--foreground] hover:bg-[--secondary] border border-[--border]'
            }`}>
            {tab.name}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              selectedRole === tab.id ? 'bg-white/20 text-white' : 'bg-[--secondary] text-[--muted-foreground]'
            }`}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        <SearchBar placeholder="Search by name, email, or ID..." onSearch={setSearchQuery} />
      </div>

      <div className="bg-white rounded-lg border border-[--border] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <p className="text-center text-[--muted-foreground] py-10">No users found.</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[--primary-blue] rounded-full flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0) ?? '?'}
                      </div>
                      <p className="font-medium text-[--foreground]">{user.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={roleVariant(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></TableCell>
                  <TableCell>{user.department || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{idOf(user)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'secondary'}>
                      {user.isActive ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{createdAt(user)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user)} disabled={togglingId === user.id}>
                        {togglingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} disabled={deletingId === user.id}>
                        {deletingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-[--danger]" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary">Add User</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="John" required />
            <Input label="Last Name" placeholder="Doe" required />
          </div>
          <Input type="email" label="Email Address" placeholder="john.doe@university.edu" required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" options={[{ value: '', label: 'Select Role' }, { value: 'student', label: 'Student' }, { value: 'faculty', label: 'Faculty' }, { value: 'admin', label: 'Admin' }]} required />
            <Select label="Department" options={[{ value: '', label: 'Select Department' }, { value: 'CECE', label: 'CECE' }, { value: 'Ctelan', label: 'Ctelan' }, { value: 'CBA', label: 'CBA' }]} required />
          </div>
          <Input label="Student/Faculty/Employee ID" placeholder="S2024001" required />
          <div className="grid grid-cols-2 gap-4">
            <Input type="password" label="Temporary Password" placeholder="Create password" required />
            <Select label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} required />
          </div>
        </div>
      </Modal>
    </div>
  );
}
