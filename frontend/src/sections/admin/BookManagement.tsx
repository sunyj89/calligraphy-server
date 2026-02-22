import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookOpen, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface BookItem {
  id: string;
  name: string;
  cover?: string;
  description?: string;
  orderNum: number;
  isActive: boolean;
  createdAt: string;
}

export function BookManagement() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', orderNum: 0 });

  const [showEdit, setShowEdit] = useState(false);
  const [editBook, setEditBook] = useState<BookItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', orderNum: 0 });

  const [error, setError] = useState('');

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getBooks();
      setBooks(res.items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleCreate = async () => {
    setError('');
    if (!createForm.name) {
      setError('请填写练习册名称');
      return;
    }
    try {
      await api.createBook(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', orderNum: 0 });
      loadBooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    }
  };

  const handleEdit = async () => {
    if (!editBook) return;
    setError('');
    try {
      await api.updateBook(editBook.id, editForm);
      setShowEdit(false);
      loadBooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    }
  };

  const handleDelete = async (book: BookItem) => {
    if (!confirm(`确认删除练习册 "${book.name}"？`)) return;
    try {
      await api.deleteBook(book.id);
      loadBooks();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  };

  const openEdit = (b: BookItem) => {
    setEditBook(b);
    setEditForm({ name: b.name, description: b.description || '', orderNum: b.orderNum });
    setShowEdit(true);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              练习册管理
            </CardTitle>
            <Button onClick={() => { setShowCreate(true); setError(''); setCreateForm({ name: '', description: '', orderNum: books.length + 1 }); }}>
              <Plus className="w-4 h-4 mr-1" />
              添加练习册
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {books.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <Badge variant="secondary" className="shrink-0 w-10 justify-center">{b.orderNum}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.name}</p>
                  {b.description && <p className="text-sm text-gray-500 truncate">{b.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(b)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {isLoading ? '加载中...' : '暂无练习册'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 创建 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加练习册</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="如：第一册 - 基础笔画" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="练习册描述" />
            </div>
            <div className="space-y-2">
              <Label>排序号</Label>
              <Input type="number" value={createForm.orderNum} onChange={(e) => setCreateForm({ ...createForm, orderNum: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑练习册</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>名称</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>排序号</Label>
              <Input type="number" value={editForm.orderNum} onChange={(e) => setEditForm({ ...editForm, orderNum: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>取消</Button>
            <Button onClick={handleEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
