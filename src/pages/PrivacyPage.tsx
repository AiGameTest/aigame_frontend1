export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* 헤더 */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-pink/70 font-semibold mb-2">Legal</p>
        <h1 className="text-3xl font-black text-white">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mt-2">시행일: 2026년 2월 19일 · 최종 수정일: 2026년 2월 19일</p>
      </div>

      <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

        {/* 개요 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-gray-400">
          Open Clue(이하 "서비스")는 「개인정보 보호법」 및 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 본 개인정보처리방침을 수립·공개합니다. 본 방침은 서비스가 수집하는 개인정보의 항목, 수집 목적, 보유 기간, 제3자 제공 여부 등을 안내합니다.
        </div>

        {/* 제1조 */}
        <Section title="제1조 (수집하는 개인정보 항목 및 수집 방법)">
          <p className="font-semibold text-white mb-2">① 소셜 로그인 시 수집 항목</p>
          <p>회원 가입 및 로그인은 소셜 로그인(카카오, 구글)을 통해 이루어지며, 해당 플랫폼으로부터 아래 정보를 제공받습니다.</p>
          <Table
            headers={['제공자', '수집 항목', '수집 목적']}
            rows={[
              ['카카오', '이메일 주소, 프로필 이미지', '회원 식별 및 서비스 제공'],
              ['구글', '이메일 주소, 프로필 이미지', '회원 식별 및 서비스 제공'],
            ]}
          />
          <p className="mt-4 font-semibold text-white mb-2">② 서비스 이용 중 자동 수집 항목</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
            <li>접속 IP 주소, 브라우저 종류 및 버전, 운영체제</li>
            <li>서비스 이용 기록(게임 세션, 클릭 로그 등)</li>
            <li>쿠키 및 유사 기술을 통한 인증 토큰</li>
          </ul>
          <p className="mt-4 font-semibold text-white mb-2">③ 이용자가 직접 입력하는 항목</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
            <li>닉네임, 프로필 이미지(변경 시)</li>
            <li>서비스 내 작성 콘텐츠(사건 시나리오, 댓글 등)</li>
          </ul>
        </Section>

        {/* 제2조 */}
        <Section title="제2조 (개인정보의 수집 및 이용 목적)">
          <p>수집한 개인정보는 다음의 목적으로만 이용됩니다.</p>
          <Table
            headers={['목적', '상세 내용']}
            rows={[
              ['회원 관리', '회원 식별, 로그인 인증, 계정 보안 유지'],
              ['서비스 제공', '게임 세션 운영, AI 사건 생성, 콘텐츠 저장 및 표시'],
              ['코인 관리', '코인 잔액 조회, 거래 내역 관리 (정식 출시 후)'],
              ['고객 지원', '문의 처리, 분쟁 해결, 서비스 오류 대응'],
              ['서비스 개선', '이용 통계 분석, 기능 개발 및 품질 향상'],
              ['법적 의무 이행', '관련 법령에 따른 의무 준수'],
            ]}
          />
        </Section>

        {/* 제3조 */}
        <Section title="제3조 (개인정보의 보유 및 이용 기간)">
          <p>회사는 원칙적으로 이용 목적이 달성된 후 개인정보를 지체 없이 파기합니다. 단, 다음의 경우 해당 기간 동안 보관합니다.</p>
          <Table
            headers={['항목', '보유 기간', '근거']}
            rows={[
              ['회원 정보', '회원 탈퇴 시까지', '서비스 제공 계약'],
              ['서비스 이용 기록', '회원 탈퇴 후 1년', '내부 방침'],
              ['결제 및 코인 거래 기록', '5년', '전자상거래법'],
              ['계약 또는 청약 철회 기록', '5년', '전자상거래법'],
              ['소비자 불만 및 분쟁 처리 기록', '3년', '전자상거래법'],
              ['접속 로그', '3개월', '통신비밀보호법'],
            ]}
          />
        </Section>

        {/* 제4조 */}
        <Section title="제4조 (개인정보의 제3자 제공)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.</li>
            <li>다음의 경우에는 예외적으로 제공될 수 있습니다.
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-gray-400">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 따르거나 수사 목적으로 관련 기관이 적법한 절차를 통해 요청한 경우</li>
              </ul>
            </li>
          </ol>
        </Section>

        {/* 제5조 */}
        <Section title="제5조 (개인정보 처리 위탁)">
          <p>회사는 서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다.</p>
          <Table
            headers={['수탁업체', '위탁 업무', '보유 기간']}
            rows={[
              ['Amazon Web Services (AWS)', '서버 인프라 운영 및 데이터 저장', '위탁 계약 종료 시까지'],
              ['카카오', '소셜 로그인 인증', '위탁 계약 종료 시까지'],
              ['Google', '소셜 로그인 인증', '위탁 계약 종료 시까지'],
            ]}
          />
          <p className="mt-3 text-gray-500">수탁업체 변경 시 본 방침을 통해 공지합니다.</p>
        </Section>

        {/* 제6조 */}
        <Section title="제6조 (쿠키 및 유사 기술)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>서비스는 로그인 인증 유지를 위해 HTTP 쿠키(세션 쿠키, 리프레시 토큰)를 사용합니다.</li>
            <li>쿠키는 로그아웃 시 또는 만료 기간 도래 시 자동으로 삭제됩니다.</li>
            <li>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.</li>
          </ol>
        </Section>

        {/* 제7조 */}
        <Section title="제7조 (이용자의 권리 및 행사 방법)">
          <p>이용자(또는 법정 대리인)는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-2 mt-3 pl-2">
            <li>개인정보 열람 요청</li>
            <li>오류 정정 요청</li>
            <li>삭제 요청 (단, 법령상 보관 의무가 있는 경우 제외)</li>
            <li>처리 정지 요청</li>
          </ul>
          <p className="mt-4">
            위 권리 행사는 서비스 내 프로필 설정 페이지 또는 아래 개인정보 보호 담당자에게 이메일로 요청하실 수 있습니다. 회사는 요청을 접수한 날로부터 10일 이내에 조치합니다.
          </p>
        </Section>

        {/* 제8조 */}
        <Section title="제8조 (개인정보의 파기)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>회원 탈퇴 등 보유 목적이 달성된 개인정보는 지체 없이 파기합니다.</li>
            <li>전자적 파일 형태의 개인정보는 복구가 불가능한 방식으로 영구 삭제하고, 종이 문서는 분쇄 또는 소각하여 파기합니다.</li>
          </ol>
        </Section>

        {/* 제9조 */}
        <Section title="제9조 (만 14세 미만 아동의 개인정보)">
          <p>
            서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 회원 가입을 허용하지 않습니다. 만 14세 미만 아동의 개인정보가 수집된 사실을 인지한 경우, 회사는 해당 정보를 즉시 삭제합니다.
          </p>
        </Section>

        {/* 제10조 */}
        <Section title="제10조 (개인정보 보호 담당자)">
          <p>개인정보 처리에 관한 문의, 불만, 피해 구제는 아래 담당자에게 연락하시기 바랍니다.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1 text-gray-400">
            <p><span className="text-white font-semibold">담당자:</span> Open Clue 개인정보 보호 담당</p>
            <p><span className="text-white font-semibold">이메일:</span> privacy@openclue.io</p>
          </div>
          <p className="mt-4 text-gray-500">
            기타 개인정보 침해 신고·상담은 아래 기관에 문의하실 수 있습니다.
          </p>
          <ul className="mt-2 space-y-1 text-gray-500 list-disc list-inside pl-2">
            <li>개인정보 침해신고센터: privacy.kisa.or.kr / ☎ 118</li>
            <li>개인정보 분쟁조정위원회: www.kopico.go.kr / ☎ 1833-6972</li>
            <li>대검찰청 사이버범죄수사단: www.spo.go.kr / ☎ 1301</li>
            <li>경찰청 사이버안전국: ecrm.cyber.go.kr / ☎ 182</li>
          </ul>
        </Section>

        {/* 제11조 */}
        <Section title="제11조 (개인정보처리방침의 변경)">
          <p>
            본 방침은 법령·정책 변경이나 서비스 변화에 따라 개정될 수 있습니다. 변경 시에는 시행일 7일 전 서비스 내 공지사항을 통해 안내드리며, 중요한 변경의 경우 30일 전에 공지합니다.
          </p>
        </Section>

        <div className="pt-6 border-t border-white/10 text-xs text-gray-600">
          본 개인정보처리방침은 2026년 2월 19일부터 시행됩니다.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-white/[0.06] last:border-0 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-300 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}