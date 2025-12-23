import { Download, Upload, FileText, FileJson, Book, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExportPage() {
  const exportFormats = [
    {
      id: 'pdf',
      title: 'PDF',
      description: '출력용 PDF 파일',
      icon: FileText,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      id: 'docx',
      title: 'Word (DOCX)',
      description: 'Microsoft Word 형식',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'txt',
      title: '텍스트 (TXT)',
      description: '순수 텍스트 파일',
      icon: FileText,
      color: 'text-stone-500',
      bgColor: 'bg-stone-50',
    },
    {
      id: 'markdown',
      title: '마크다운 (MD)',
      description: '마크다운 형식',
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'epub',
      title: 'EPUB',
      description: '전자책 형식',
      icon: Book,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 'json',
      title: 'JSON 백업',
      description: '전체 데이터 백업',
      icon: FileJson,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ];

  const handleExport = (formatId: string) => {
    console.log('Export:', formatId);
    // TODO: 실제 내보내기 구현
    alert(`${formatId.toUpperCase()} 형식으로 내보내기가 곧 지원됩니다!`);
  };

  const handleImport = () => {
    console.log('Import');
    // TODO: 실제 가져오기 구현
    alert('가져오기 기능이 곧 지원됩니다!');
  };

  return (
    <div className="h-full overflow-y-auto bg-paper p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Download className="h-6 w-6 text-sage-500" />
            내보내기 / 가져오기
          </h1>
          <p className="text-muted-foreground mt-1">
            작품을 다양한 형식으로 내보내거나 백업 파일을 가져오세요
          </p>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              내보내기
            </CardTitle>
            <CardDescription>
              원하는 형식을 선택하여 작품을 내보내세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  className="p-4 rounded-xl border-2 border-stone-200 hover:border-sage-300
                           hover:shadow-md transition-all text-left group"
                >
                  <div className={`w-12 h-12 ${format.bgColor} rounded-xl flex items-center justify-center mb-3
                                  group-hover:scale-110 transition-transform`}>
                    <format.icon className={`h-6 w-6 ${format.color}`} />
                  </div>
                  <h3 className="font-medium">{format.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              가져오기
            </CardTitle>
            <CardDescription>
              백업 파일이나 다른 형식의 원고를 가져오세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={handleImport}
              className="border-2 border-dashed border-stone-300 rounded-xl p-8
                        text-center hover:border-sage-400 hover:bg-sage-50/50
                        transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Archive className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="font-medium mb-2">파일을 드래그하거나 클릭하세요</h3>
              <p className="text-sm text-muted-foreground">
                지원 형식: JSON, TXT, MD, DOCX
              </p>
              <Button variant="outline" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                파일 선택
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 내보내기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 내보내기 기록이 없습니다</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
