export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* 헤더 */}
      <div className="mb-10">
        <p className="badge-file inline-block mb-3">Legal Document</p>
        <h1 className="font-headline text-3xl text-sepia">이용약관</h1>
        <p className="font-detail text-xs text-faded mt-2 tracking-wide">시행일: 정식 출시 시 재안내 · 최종 수정일: 2026년 2월 19일</p>
      </div>

      <div className="space-y-10 font-body text-sm text-sepia/80 leading-relaxed">

        {/* 제1조 */}
        <Section title="제1조 (목적)">
          <p>
            이 약관은 Open Clue(이하 "서비스")를 운영하는 서비스 제공자(이하 "회사")와 이용자 간의 서비스 이용에 관한 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </Section>

        {/* 제2조 */}
        <Section title="제2조 (정의)">
          <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol className="list-decimal list-inside space-y-2 mt-3 pl-2">
            <li><strong className="text-white">"서비스"</strong>란 회사가 제공하는 AI 기반 추리 게임 플랫폼 Open Clue 및 관련 제반 서비스를 말합니다.</li>
            <li><strong className="text-white">"이용자"</strong>란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
            <li><strong className="text-white">"회원"</strong>이란 소셜 로그인을 통해 계정을 생성하고 서비스를 이용하는 자를 말합니다.</li>
            <li><strong className="text-white">"코인"</strong>이란 서비스 내에서 특정 기능을 이용하기 위해 사용되는 가상의 재화를 말합니다.</li>
            <li><strong className="text-white">"콘텐츠"</strong>란 이용자가 서비스 내에서 작성·등록하는 사건 시나리오, 댓글, 이미지 등 일체의 정보를 말합니다.</li>
          </ol>
        </Section>

        {/* 제3조 */}
        <Section title="제3조 (약관의 효력 및 변경)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경 시 적용일 7일 전에 공지합니다. 단, 이용자에게 불리한 변경의 경우 30일 전에 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다. 변경된 약관 공지 후 계속 서비스를 이용하면 변경 약관에 동의한 것으로 간주합니다.</li>
          </ol>
        </Section>

        {/* 제4조 */}
        <Section title="제4조 (회원 가입 및 계정)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>서비스는 카카오, 구글 등 소셜 로그인을 통해 회원 가입이 이루어지며, 별도의 회원 정보 입력 없이 계정이 생성됩니다.</li>
            <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 제3자에게 계정을 양도하거나 공유할 수 없습니다.</li>
            <li>타인의 계정을 무단으로 사용하거나 계정 정보를 도용하는 행위는 금지됩니다.</li>
            <li>회사는 다음 각 호에 해당하는 경우 회원 가입을 거부하거나 계정을 해지할 수 있습니다.
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-gray-400">
                <li>타인의 명의 또는 허위 정보를 이용한 경우</li>
                <li>관련 법령 또는 이 약관을 위반한 경우</li>
                <li>서비스의 정상적인 운영을 방해한 경우</li>
              </ul>
            </li>
          </ol>
        </Section>

        {/* 제5조 */}
        <Section title="제5조 (서비스 이용)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>서비스는 연중무휴 24시간 제공되는 것을 원칙으로 하나, 시스템 점검·장애·천재지변 등의 사유로 일시 중단될 수 있습니다.</li>
            <li>일부 서비스는 코인을 소모하거나 결제가 필요할 수 있습니다.</li>
            <li>AI가 생성하는 콘텐츠(사건 시나리오, 용의자 답변 등)는 참고용이며, 회사는 AI 생성 콘텐츠의 정확성·완전성을 보증하지 않습니다.</li>
            <li>회사는 서비스의 내용, 기능, UI 등을 사전 통지 없이 변경할 수 있습니다.</li>
          </ol>
        </Section>

        {/* 제6조 */}
        <Section title="제6조 (코인 및 결제)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>코인은 서비스 내 유료 기능 이용을 위해 사용되는 가상 재화로, 현금으로 환급되지 않습니다.</li>
            <li>코인 충전 기능은 현재 준비 중이며, 정식 출시 후 유료 결제 및 보상형 광고를 통해 제공될 예정입니다.</li>
            <li>유료 결제로 구매한 코인은 관련 법령 및 회사의 환불 정책에 따라 환급될 수 있습니다.</li>
            <li>이용자의 귀책 사유로 코인이 소멸된 경우 회사는 이를 복구할 의무가 없습니다.</li>
            <li>회사는 서비스 종료 시 사전 공지 후 미사용 유료 코인에 대해 환급 절차를 진행합니다.</li>
          </ol>
        </Section>

        {/* 제7조 */}
        <Section title="제7조 (이용자 콘텐츠)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>이용자가 서비스에 등록한 콘텐츠(사건 시나리오, 댓글, 이미지 등)에 대한 저작권은 해당 이용자에게 귀속됩니다.</li>
            <li>이용자는 서비스에 콘텐츠를 등록함으로써 회사에 해당 콘텐츠를 서비스 운영 목적으로 사용·복제·배포·전시할 수 있는 비독점적·무상의 라이선스를 부여합니다.</li>
            <li>이용자는 다음 각 호에 해당하는 콘텐츠를 등록할 수 없습니다.
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-gray-400">
                <li>타인의 저작권, 상표권 등 지식재산권을 침해하는 콘텐츠</li>
                <li>음란, 폭력적이거나 미성년자에게 유해한 콘텐츠</li>
                <li>특정인을 비방하거나 명예를 훼손하는 콘텐츠</li>
                <li>개인정보를 무단으로 수집·공개하는 콘텐츠</li>
                <li>관련 법령에 위반되는 콘텐츠</li>
              </ul>
            </li>
            <li>회사는 위반 콘텐츠를 사전 통보 없이 삭제할 수 있습니다.</li>
          </ol>
        </Section>

        {/* 제8조 */}
        <Section title="제8조 (금지 행위)">
          <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
          <ol className="list-decimal list-inside space-y-2 mt-3 pl-2">
            <li>서비스의 정상적인 운영을 방해하는 행위(DDoS, 크롤링, 자동화 도구 사용 등)</li>
            <li>서비스를 통해 스팸·광고·허위 정보를 유포하는 행위</li>
            <li>다른 이용자를 사칭하거나 허위 정보를 제공하는 행위</li>
            <li>회사의 사전 동의 없이 서비스를 상업적으로 이용하는 행위</li>
            <li>서비스의 소스 코드, 알고리즘 등을 역분석·복제하는 행위</li>
            <li>관련 법령에 위반되는 모든 행위</li>
          </ol>
        </Section>

        {/* 제9조 */}
        <Section title="제9조 (서비스 중단 및 종료)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>회사는 경영상 또는 기술상의 이유로 서비스를 변경하거나 종료할 수 있습니다.</li>
            <li>서비스를 종료하는 경우 회사는 종료일 30일 전에 서비스 내 공지를 통해 이용자에게 알립니다.</li>
          </ol>
        </Section>

        {/* 제10조 */}
        <Section title="제10조 (책임의 한계)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>회사는 천재지변, 전쟁, 해킹, 통신 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>회사는 AI가 생성하는 콘텐츠의 정확성 및 적절성에 대한 책임을 지지 않습니다.</li>
            <li>이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 회사는 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</li>
          </ol>
        </Section>

        {/* 제11조 */}
        <Section title="제11조 (준거법 및 관할)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>이 약관의 해석 및 분쟁 해결은 대한민국 법률을 준거법으로 합니다.</li>
            <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
          </ol>
        </Section>

        <div className="pt-6 border-t border-ghost font-detail text-[10px] text-ghost tracking-widest">
          본 약관은 2026년 2월 19일부터 시행됩니다.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-headline text-base text-amber mb-3 pb-2 border-b border-ghost">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}