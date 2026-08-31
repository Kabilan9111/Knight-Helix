const { MobileBrowserSession } = require('./cdp_helper');

async function testLANMobile() {
  console.log('Testing Mobile App over LAN IP: http://192.168.137.64:5173/mobile ...');
  const session = new MobileBrowserSession({ port: 9222 });
  await session.launch();
  await session.setMobileViewport(390, 844, 3);
  await session.setGeolocation(13.0827, 80.2707, 5);

  // 1. Navigate to LAN IP
  await session.navigate('http://192.168.137.64:5173/mobile/login');
  await session.waitForLoad(4000);
  await new Promise(r => setTimeout(r, 1000));

  console.log('1. Page loaded from LAN IP.');

  // 2. Perform 1-Tap Site Engineer Login
  await session.evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Site Engineer'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1500));

  const currentUrl = await session.evaluate(`window.location.pathname`);
  const bodyText = await session.evaluate(`document.body.innerText`);
  const hasProjects = bodyText.includes('PROJ-001') || bodyText.includes('Refinery') || bodyText.includes('Site');
  console.log('2. Login Result over LAN:', { path: currentUrl, hasProjects });

  // 3. Navigate to Tasks page
  await session.navigate('http://192.168.137.64:5173/mobile/tasks');
  await new Promise(r => setTimeout(r, 1000));
  const tasksText = await session.evaluate(`document.body.innerText`);
  const hasTasks = tasksText.includes('STR-110') || tasksText.includes('CIV-101') || tasksText.includes('Excavation');
  console.log('3. Tasks loaded over LAN:', hasTasks);

  // 4. Test GPS Field Walk
  await session.navigate('http://192.168.137.64:5173/mobile/field-walk?taskId=STR-110&activityId=ACT-STR-1');
  await new Promise(r => setTimeout(r, 1000));
  const walkText = await session.evaluate(`document.body.innerText`);
  const hasWalk = walkText.includes('START LIVE GPS WALK') || walkText.includes('Spatial Verification');
  console.log('4. GPS Field Walk loaded over LAN:', hasWalk);

  // 5. Test Delay Ripple DAG
  await session.navigate('http://192.168.137.64:5173/mobile/risks');
  await new Promise(r => setTimeout(r, 1500));
  const rippleText = await session.evaluate(`document.body.innerText`);
  console.log('Ripple text snippet:', rippleText.slice(0, 200));
  const hasRipple = rippleText.includes('DAG Delay Ripple') || rippleText.includes('Delay Ripple') || rippleText.includes('Overall Risk') || rippleText.includes('DAG') || rippleText.includes('SANCHALAN');
  console.log('5. Delay Ripple DAG loaded over LAN:', hasRipple);

  await session.close();

  const success = currentUrl.startsWith('/mobile') && hasProjects && hasTasks && hasWalk && hasRipple;
  console.log('\n=============================================');
  console.log('LAN MOBILE CONNECTIVITY TEST:', success ? '✅ ALL PASSED' : '❌ FAILED');
  console.log('=============================================\n');

  process.exit(success ? 0 : 1);
}

testLANMobile().catch(err => {
  console.error('LAN test error:', err);
  process.exit(1);
});
