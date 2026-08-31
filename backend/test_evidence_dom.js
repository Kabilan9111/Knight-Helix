const { MobileBrowserSession } = require('./cdp_helper');

async function testEvidenceDOM() {
  const session = new MobileBrowserSession({ port: 9222 });
  await session.launch();
  await session.setMobileViewport(390, 844, 3);
  await session.navigate('http://localhost:5173/mobile/login');
  
  // Login as ADMIN
  await session.evaluate(`(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Site Engineer'));
    if (b) b.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));

  // Navigate to evidence
  await session.navigate('http://localhost:5173/mobile/evidence');
  await new Promise(r => setTimeout(r, 800));

  const buttons = await session.evaluate(`(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText,
      className: b.className
    }));
  })()`);
  console.log('Buttons on Evidence page:', buttons);

  const hasTextarea = await session.evaluate(`!!document.querySelector('textarea')`);
  console.log('Has textarea before click:', hasTextarea);

  // Click Submit Field Evidence tab
  await session.evaluate(`(() => {
    const tab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit Field Evidence'));
    if (tab) tab.click();
  })()`);
  await new Promise(r => setTimeout(r, 500));

  const hasTextareaAfter = await session.evaluate(`!!document.querySelector('textarea')`);
  console.log('Has textarea after tab click:', hasTextareaAfter);

  await session.close();
}

testEvidenceDOM().catch(console.error);
